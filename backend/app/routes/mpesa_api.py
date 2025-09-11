from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, WithdrawalRequest, WithdrawalStatus, Transaction, db, Notification, Loan, LoanStatus
from app.utils.mpesa import initiate_stk_push, initiate_b2c_payment
from app.routes.contributions import log_contribution
from app.utils.helpers import format_phone_number
import logging
import datetime

mpesa_bp = Blueprint("mpesa", __name__)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


@mpesa_bp.route("/mpesa/stkpush", methods=["POST"])
@jwt_required()
def stk_push():
    """
    Initiates an STK push for contributions or loan repayments.
    """
    data = request.get_json()
    user_id = int(get_jwt_identity())
    amount = data.get("amount")

    if not amount or float(amount) <= 0:
        return jsonify({"error": "Invalid amount"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    phone_number = format_phone_number(user.phone)
    if not phone_number:
        return jsonify({"error": "Invalid phone number format"}), 400

    logger.info(f"Initiating STK push for user {user_id}, Amount: {amount}")

    try:
        response = initiate_stk_push(user_id, amount)
    except Exception as e:
        logger.error(f"STK push failed due to an exception: {str(e)}")
        return jsonify({"error": "STK push failed", "details": str(e)}), 500

    if response.get("ResponseCode") == "0":
        logger.info(f"STK push initiated successfully for user {user_id}, CheckoutRequestID: {response.get('CheckoutRequestID')}")
        return jsonify({
            "message": "STK push initiated successfully",
            "checkout_request_id": response.get("CheckoutRequestID")
        }), 200

    logger.error(f"STK push failed for user {user_id}: {response}")
    return jsonify({"message": "STK push failed", "error": response}), 400


@mpesa_bp.route("/callback/transaction", methods=["POST"])
def mpesa_callback():
    """
    Handles M-Pesa STK push callback.
    Logs contributions and applies payments to outstanding loans.
    """
    data = request.get_json()
    logger.info(f"M-Pesa Callback Data: {data}")

    stk_callback = data.get("Body", {}).get("stkCallback", {})
    if not stk_callback:
        logger.error("Invalid callback: missing stkCallback")
        return jsonify({"error": "Invalid callback data"}), 400

    callback_metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])
    receipt_number = amount = phone_number = None

    for item in callback_metadata:
        if item["Name"] == "MpesaReceiptNumber":
            receipt_number = item["Value"]
        elif item["Name"] == "Amount":
            amount = float(item["Value"])
        elif item["Name"] == "PhoneNumber":
            phone_number = str(item["Value"])

    if not all([receipt_number, amount, phone_number]):
        logger.error("Callback missing required fields")
        return jsonify({"error": "Invalid callback data"}), 400

    user = User.query.filter_by(phone=phone_number).first()
    if not user:
        logger.warning(f"User with phone {phone_number} not found")
        return jsonify({"error": "User not found"}), 404

    if Transaction.query.filter_by(reference=receipt_number).first():
        logger.warning(f"Duplicate transaction detected: {receipt_number}")
        return jsonify({"error": "Duplicate transaction detected"}), 400

    # Log contribution first
    response, status_code = log_contribution(user.id, amount, receipt_number)
    if status_code != 201:
        return jsonify(response), status_code

    # Apply remaining amount to outstanding loans
    remaining = float(amount)
    loans = Loan.query.filter(
        Loan.user_id == user.id,
        Loan.status == LoanStatus.DISBURSED
    ).order_by(Loan.date).all()

    for loan in loans:
        if remaining <= 0:
            break
        pay_amount = min(remaining, loan.outstanding)
        loan.outstanding -= pay_amount
        remaining -= pay_amount
        if loan.outstanding == 0:
            loan.status = LoanStatus.REPAID
        db.session.add(loan)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating loan repayments: {e}")

    return jsonify(response), status_code


@mpesa_bp.route("/mpesa/withdrawal", methods=["POST"])
@jwt_required()
def process_withdrawal():
    """
    Processes approved withdrawal via B2C API.
    """
    data = request.get_json()
    withdrawal_request_id = data.get("withdrawal_id")
    transaction_id = data.get("transaction_id")

    withdrawal = WithdrawalRequest.query.filter_by(transaction_id=transaction_id, status=WithdrawalStatus.APPROVED).first()
    if not withdrawal:
        return jsonify({"error": "No approved withdrawal found"}), 400

    transaction = Transaction.query.get(withdrawal.transaction_id)
    admin = User.query.get(transaction.user_id)
    if not admin or not admin.is_admin:
        return jsonify({"error": "Invalid admin details"}), 400

    phone_number = format_phone_number(admin.phone)
    if not phone_number:
        return jsonify({"error": "Invalid admin phone number format"}), 400

    logger.info(f"Processing withdrawal {withdrawal_request_id} for admin {admin.id}")

    try:
        response = initiate_b2c_payment(
            user_id=admin.id,
            phone_number=phone_number,
            amount=transaction.amount,
            reason=transaction.reason,
            withdrawal_request_id=withdrawal_request_id
        )

        originator_id = response.get("OriginatorConversationID")
        if not originator_id:
            logger.error("B2C payment failed: No transaction ID returned")
            return jsonify({"error": "B2C payment failed"}), 500

        withdrawal.mpesa_transaction_id = originator_id
        db.session.commit()
        logger.info(f"Withdrawal {withdrawal.id} updated with M-Pesa transaction ID {originator_id}")

    except Exception as e:
        logger.error(f"B2C payment failed: {e}")
        return jsonify({"error": "B2C payment failed", "details": str(e)}), 500

    return jsonify(response), 200


@mpesa_bp.route("/callback/b2c/result", methods=["POST"])
def b2c_callback():
    """
    Handles B2C M-Pesa callback and updates withdrawal status.
    """
    data = request.get_json()
    logger.info(f"B2C Callback: {data}")

    result = data.get("Result", {})
    result_code = result.get("ResultCode")
    mpesa_transaction_id = result.get("OriginatorConversationID")
    transaction_id = result.get("TransactionID")
    result_desc = result.get("ResultDesc")

    if not mpesa_transaction_id:
        logger.error("Missing mpesa_transaction_id in callback")
        return jsonify({"error": "Invalid callback data"}), 400

    withdrawal = WithdrawalRequest.query.filter_by(mpesa_transaction_id=mpesa_transaction_id).first()
    if not withdrawal:
        logger.warning(f"Withdrawal with transaction ID {mpesa_transaction_id} not found")
        return jsonify({"error": "Transaction not found"}), 400

    try:
        if result_code == 0:
            withdrawal.status = WithdrawalStatus.COMPLETED
            group_members = User.query.filter_by(group_id=withdrawal.group_id).all()
            for member in group_members:
                notification = Notification(
                    user_id=member.id,
                    group_id=withdrawal.group_id,
                    message=f"Withdrawal of Ksh {withdrawal.amount} via M-Pesa completed successfully",
                    type="Withdrawal",
                    date=datetime.datetime.now(datetime.timezone.utc)
                )
                db.session.add(notification)
        else:
            withdrawal.status = WithdrawalStatus.FAILED
            logger.error(f"Withdrawal {mpesa_transaction_id} failed: {result_desc}")

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating withdrawal status: {e}")

    return jsonify({"message": "Callback processed successfully"})