from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Loan, Transaction, TransactionType, Notification
from utils.mpesa import initiate_b2c_payment, initiate_stk_push
import datetime
import logging

loan_bp = Blueprint('loan', __name__)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

@loan_bp.route('/loans/request', methods=['POST'])
@jwt_required()
def request_loan():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    amount = data.get('amount')

    if not amount or float(amount) <= 0:
        return jsonify({"error": "Invalid amount"}), 400

    user = User.query.get(user_id)
    if not user or not user.group_id:
        return jsonify({"error": "User or group not found"}), 404

    loan = Loan(
        user_id = user_id,
        group_id = user.group_id,
        amount = float(amount),
        outstanding = float(amount),
        status = "pending"
    )
    db.session.add(loan)
    db.session.commit()

    # Notify admin
    admin = User.query.get(user.group.admin_id) if user.group else None
    if admin:
        notif = Notification(
            user_id=admin.id,
            group_id=user.group_id,
            message=f"{user.name} requested a loan of Ksh {amount}",
            type="Loan request",
            date=datetime.datetime.now(datetime.timezone.utc)
        )
        db.session.add(notif)
        db.session.commit()

    return jsonify({"message": "Loan request submitted", "loan_id": loan.id}), 201


@loan_bp.route('/loans/approve/<int:loan_id>', methods=['POST'])
@jwt_required()
def approve_loan(loan_id):
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)
    if not admin or not admin.is_admin:
        return jsonify({"error": "Unauthorized"}), 403

    loan = Loan.query.get(loan_id)
    if not loan or loan.status != "pending":
        return jsonify({"error": "Loan not found or already processed"}), 404

    loan.status = "approved"
    loan.approved_by = admin.id
    db.session.commit()

    return jsonify({"message": "Loan approved"}), 200


@loan_bp.route('/loans/disburse/<int:loan_id>', methods=['POST'])
@jwt_required()
def disburse_loan(loan_id):
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)
    if not admin or not admin.is_admin:
        return jsonify({"error": "Unauthorized"}), 403

    loan = Loan.query.get(loan_id)
    if not loan or loan.status != "approved":
        return jsonify({"error": "Loan not found or not approved"}), 404

    borrower = User.query.get(loan.user_id)
    if not borrower:
        return jsonify({"error": "Borrower not found"}), 404

    # call B2C to send money to borrower
    try:
        response = initiate_b2c_payment(
            user_id = borrower.id,
            phone_number = borrower.phone,
            amount = loan.amount,
            reason = "Loan Disbursement",
            withdrawal_request_id = None
        )
    except Exception as e:
        logger.error(f"B2C failed: {e}")
        return jsonify({"error": "B2C disbursement failed", "details": str(e)}), 500

    # Log a transaction (DEBIT from group)
    tx = Transaction(
        user_id = borrower.id,
        group_id = loan.group_id,
        amount = loan.amount,
        type = TransactionType.DEBIT,
        reason = "Loan Disbursed",
        date = datetime.datetime.now(datetime.timezone.utc)
    )
    db.session.add(tx)
    db.session.commit()

    loan.status = "disbursed"
    loan.disbursed_transaction_id = tx.id
    db.session.commit()

    # Notify borrower
    notif = Notification(
        user_id = borrower.id,
        group_id = loan.group_id,
        message = f"Your loan of Ksh {loan.amount} was disbursed.",
        type = "Loan disbursed",
        date = datetime.datetime.now(datetime.timezone.utc)
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({"message": "Loan disbursed", "b2c_response": response}), 200


@loan_bp.route('/loans/repay', methods=['POST'])
@jwt_required()
def repay_loan():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    amount = data.get('amount')
    loan_id = data.get('loan_id')  # optional: which loan to repay

    if not amount or float(amount) <= 0:
        return jsonify({"error": "Invalid amount"}), 400

    # Initiate STK push to collect from the user (repay)
    try:
        response = initiate_stk_push(user_id, float(amount))
    except Exception as e:
        logger.error(f"STK push failed: {str(e)}")
        return jsonify({"error": "STK push failed", "details": str(e)}), 500

    # We do not mark loan as paid here — loan outstanding is decreased only when M-Pesa callback confirms payment.
    return jsonify({"message": "Repayment STK push initiated", "stk_response": response}), 200