from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, WithdrawalRequest, WithdrawalStatus, Transaction, db, Notification
from utils.mpesa import initiate_stk_push, initiate_b2c_payment
from routes.contributions import log_contribution
from utils.helpers import format_phone_number
import logging
import datetime

mpesa_bp = Blueprint("mpesa", __name__)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

@mpesa_bp.route("/mpesa/stkpush", methods=["POST"])
@jwt_required()
def stk_push():
    """ Initiates an STK push for contributions. """
    data = request.get_json()
    user_id = get_jwt_identity()
    amount = data.get("amount")

    if not amount or amount <= 0:
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
    """ Handles M-Pesa callback and logs contributions. """
    data = request.get_json()

    logger.info(f"Full M-Pesa Callback Data: {data}")

    callback_body = data.get("Body", {})
    stk_callback = callback_body.get("stkCallback", {})

    if not stk_callback:
        logger.error("Invalid callback data received: missing stkCallback")
        return jsonify({"error": "Invalid callback data"}), 400
    
    callback_metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])

    receipt_number = None
    amount = None
    phone_number = None

    for item in callback_metadata:
        if item["Name"] == "MpesaReceiptNumber":
            receipt_number = item["Value"]
        elif item["Name"] == "Amount":
            amount = item["Value"]
        elif item["Name"] == "PhoneNumber":
            phone_number = str(item["Value"])

    if not all([receipt_number, amount, phone_number]):
        logger.error("Callback data missing required fields")
        return jsonify({"error": "Invalid callback data"}), 400

    # Fetch user by phone number
    user = User.query.filter_by(phone=phone_number).first()
    if not user:
        logger.warning(f"User with phone {phone_number} not found")
        return jsonify({"error": "User not found"}), 404
    
    if Transaction.query.filter_by(reference=receipt_number).first():
        logger.warning(f"Duplicate transaction detected: {receipt_number}")
        return jsonify({"error": "Duplicate transaction detected"}), 400

    logger.info(f"Logging contribution for user {user.id}, Amount: {amount}, Receipt: {receipt_number}")
    
    # Log contribution using the helper function
    response, status_code = log_contribution(user.id, amount, receipt_number)

    return jsonify(response), status_code


@mpesa_bp.route("/mpesa/withdrawal", methods=["POST"])
@jwt_required()
def process_withdrawal():
    """ Processes an approved withdrawal via the M-Pesa B2C API """
    data = request.get_json()
    withdrawal_request_id = data.get("withdrawal_id")
    transaction_id = data.get("transaction_id")

    withdrawal = WithdrawalRequest.query.filter_by(transaction_id=transaction_id, status=WithdrawalStatus.APPROVED).first()

    if not withdrawal:
        return jsonify({"error": "No approved withdrawal found for this transaction"}), 400
    
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

        originator_conversation_id = response.get("OriginatorConversationID")

        if not originator_conversation_id:
            logger.error("B2C payment initiated but no OriginatorConversationID returned")
            return jsonify({"error": "B2C payment failed: No transactionID returned"}), 500

        withdrawal.mpesa_transaction_id = originator_conversation_id
        db.session.commit()

        logger.info(f"Updated withdrawal {withdrawal.id} with M-Pesa transaction ID {originator_conversation_id}")
    except Exception as e:
        logger.error(f"B2c payment failed: {str(e)}")
        return jsonify({"error": "B2C payment failed", "details": str(e)}), 500

    return jsonify(response), 200


@mpesa_bp.route("/callback/b2c/result", methods=["POST"])
def b2c_callback():
    """ Handles M-Pesa B2C callback and updates withdrawal status. """
    data = request.get_json()
    logger.info(f"B2C Callback Response: {data}")

    result = data.get("Result", {})
    result_code = result.get("ResultCode")
    transaction_id = result.get("TransactionID")
    mpesa_transaction_id = result.get("OriginatorConversationID")
    result_desc = result.get("ResultDesc")

    if not mpesa_transaction_id:
        logger.error("Missing mpesa_transaction_id in callback")
        return jsonify({"error": "Invalid callback data"}), 400

    withdrawal = WithdrawalRequest.query.filter_by(mpesa_transaction_id=mpesa_transaction_id).first()

    if not withdrawal:
        logger.warning(f"Withdrawal request with transaction ID {mpesa_transaction_id} not found")
        return jsonify({"error": "Transaction not found"}), 400
    
    
    try:
        if result_code == 0:
            withdrawal.status = WithdrawalStatus.COMPLETED
            logger.info(f"Withdrawal {mpesa_transaction_id} completed successfully")
            group_members = User.query.filter_by(group_id=withdrawal.group_id).all()

            for member in group_members:
                notification =  Notification(
                    user_id=member.id,
                    group_id=withdrawal.group_id,
                    message=f"A withdrawal of ksh {withdrawal.amount} via M-pesa has been completed successfully",
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
        logger.error(f"Error updating withdrawal status: {str(e)}")

    return jsonify({"message": "Callback processed successfully"})