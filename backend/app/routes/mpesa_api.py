from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, WithdrawalRequest, WithdrawalStatus, Transaction, db
from utils.mpesa import initiate_stk_push, initiate_b2c_payment
from routes.contributions import log_contribution

mpesa_bp = Blueprint("mpesa", __name__)

@mpesa_bp.route("/mpesa/stkpush", methods=["POST"])
@jwt_required()
def stk_push():
    """
    Initiates an STK push for contributions.
    """
    data = request.get_json()
    user_id = get_jwt_identity()
    amount = data.get("amount")

    if not amount or amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    response = initiate_stk_push(user_id, amount)
    
    if response.get("ResponseCode") == "0":
        return jsonify({"message": "STK push initiated successfully", "checkout_request_id": response.get("CheckoutRequestID")}), 200
    
    return jsonify({"message": "STK push failed", "error": response}), 400


@mpesa_bp.route("/mpesa/callback", methods=["POST"])
def mpesa_callback():
    """Handles M-Pesa callback and logs contributions."""
    data = request.get_json()
    callback_metadata = data.get("Body", {}).get("stkCallback", {}).get("CallbackMetadata", {}).get("Item", [])

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
        return jsonify({"error": "Invalid callback data"}), 400

    # Fetch user by phone number
    user = User.query.filter_by(phone=phone_number).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    

    if Transaction.query.filter_by(receipt_number=receipt_number).first():
        return jsonify({"error": "Duplicate transaction detected"}), 400

    # Log contribution using the helper function
    response, status_code = log_contribution(user.id, amount, receipt_number)
    return jsonify(response), status_code


#process withdrawal via B2C API
@mpesa_bp.route("/mpesa/withdrawal", methods=["POST"])
@jwt_required()
def process_withdrawal():
    """
    Processes an approved withdrawal via the M-Pesa B2C API
    """
    data = request.get_json()
    transaction_id = data.get("transaction_id")

    withdrawal = WithdrawalRequest.query.filter_by(transaction_id=transaction_id, status=WithdrawalStatus.APPROVED).first()

    if not withdrawal:
        return jsonify({"error": "No approved withdrawal found for this transaction"}), 400
    
    transaction = Transaction.query.get(transaction_id)
    admin = User.query.get(transaction.user_id)

    if not admin or not admin.is_admin:
        return jsonify({"error": "Invalid admin details"}), 400
    
    response = initiate_b2c_payment(
        user_id=admin.id,
        phone_number=admin.phone,
        amount=transaction.amount,
        reason=transaction.reason
    )

    return jsonify(response), 200


@mpesa_bp.route("/mpesa/b2c/callback", methods=["POST"])
def b2c_callback():
    data = request.get_json()
    print("B2C Callback Response:", data)

    result_code = data["Result"].get("ResultCode")
    transaction_id = data["Result"].get("TransactionID")
    result_desc = data["Result"].get("ResultDesc")

    withdrawal = WithdrawalRequest.query.filter_by(transaction_id=transaction_id).first()

    if not withdrawal:
        return jsonify({"error": "Transaction not found"}), 400
    
    if result_code == 0:
        withdrawal.status = WithdrawalStatus.COMPLETED
    else:
        withdrawal.status = WithdrawalStatus.FAILED
        print(f"Withdrawal failed: {result_desc}")

    db.session.commit()

    return jsonify({"message": "Callback processed successfully"})

