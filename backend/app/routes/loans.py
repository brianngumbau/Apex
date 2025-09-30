from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Loan, Transaction, TransactionType, Notification, LoanStatus, TransactionReason, WithdrawalRequest, WithdrawalStatus
from app.utils.mpesa import initiate_b2c_payment, initiate_stk_push
import datetime
import logging

loan_bp = Blueprint('loan', __name__)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


@loan_bp.route('/loans/request', methods=['POST'])
@jwt_required()
def request_loan():
    user_id = get_jwt_identity()
    print("Decoded user_id:", user_id)
    data = request.get_json() or {}
    amount = float(data.get('amount') or 0)

    if amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400

    user = User.query.get(user_id)
    if not user or not user.group_id:
        return jsonify({"error": "User or group not found"}), 404

    group_id = user.group_id

    # Compute group financials
    total_contributions = db.session.query(db.func.sum(Transaction.amount)) \
        .filter(Transaction.group_id == group_id,
                Transaction.type == TransactionType.CREDIT).scalar() or 0.0

    total_withdrawals = db.session.query(db.func.sum(Transaction.amount)).join(
            WithdrawalRequest, WithdrawalRequest.transaction_id == Transaction.id
        ).filter(
            Transaction.group_id == group_id,
            Transaction.type == TransactionType.DEBIT,
            WithdrawalRequest.status.in_([WithdrawalStatus.COMPLETED, WithdrawalStatus.APPROVED])
        ).scalar() or 0.0


    outstanding_loans = db.session.query(db.func.sum(Loan.outstanding)) \
        .filter(Loan.group_id == group_id,
                Loan.status == LoanStatus.DISBURSED).scalar() or 0.0


    cash_at_hand = total_contributions - total_withdrawals - outstanding_loans
    available_company_limit = 0.4 * cash_at_hand

    if cash_at_hand <= 0 or available_company_limit <= 0:
        return jsonify({"error": "Group has insufficient funds to lend"}), 400

    # Compute user’s entitlement
    user_contributions = db.session.query(db.func.sum(Transaction.amount)) \
        .filter(Transaction.group_id == group_id,
                Transaction.user_id == user.id,
                Transaction.type == TransactionType.CREDIT).scalar() or 0.0

    if total_contributions == 0:
        return jsonify({"error": "No contributions in the group yet"}), 400

    user_entitlement = (user_contributions / total_contributions) * available_company_limit

    # Check outstanding loans for this user
    user_outstanding_loans = db.session.query(db.func.sum(Loan.outstanding)) \
        .filter(Loan.user_id == user.id,
                Loan.group_id == group_id,
                Loan.status == LoanStatus.DISBURSED).scalar() or 0.0

    if user_outstanding_loans + amount > user_entitlement:
        return jsonify({
            "error": "Loan request exceeds your limit",
            "your_entitlement": user_entitlement,
            "your_outstanding": user_outstanding_loans,
            "requested": amount
        }), 400
    

    group = user.group
    interest_rate = group.loan_interest_rate or 0.0
    interest_frequency = group.loan_interest_frequency or "monthly"

    # Create loan record (already disbursed)
    loan = Loan(
        user_id=user.id,
        group_id=group_id,
        amount=amount,
        outstanding=amount,
        status=LoanStatus.DISBURSED,
        date=datetime.datetime.now(datetime.timezone.utc),
        interest_rate=interest_rate,
        interest_frequency=interest_frequency
    )
    db.session.add(loan)
    db.session.commit()

    # Call B2C to disburse funds to borrower
    try:
        response = initiate_b2c_payment(
            user_id=user.id,
            phone_number=user.phone,
            amount=loan.amount,
            reason=TransactionReason.LOAN_DISBURSEMENT,
            withdrawal_request_id=None
        )
    except Exception as e:
        logger.error(f"B2C failed: {e}")
        return jsonify({"error": "B2C disbursement failed", "details": str(e)}), 500

    # Log a DEBIT transaction from group
    tx = Transaction(
        user_id=user.id,
        group_id=loan.group_id,
        amount=loan.amount,
        type=TransactionType.DEBIT,
        reason=TransactionReason.LOAN_DISBURSEMENT,
        date=datetime.datetime.now(datetime.timezone.utc)
    )
    db.session.add(tx)
    db.session.commit()

    loan.disbursed_transaction_id = tx.id
    db.session.commit()

    # Notify borrower
    notif = Notification(
        user_id=user.id,
        group_id=group_id,
        message=f"Your loan of Ksh {loan.amount} was disbursed.",
        type="Loan disbursed",
        date=datetime.datetime.now(datetime.timezone.utc)
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({
        "message": "Loan successfully disbursed",
        "loan_id": loan.id,
        "your_entitlement": user_entitlement,
        "requested": amount,
        "b2c_response": response
    }), 201


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

    # Loan outstanding will be reduced in callback
    return jsonify({"message": "Repayment STK push initiated", "stk_response": response}), 200


@loan_bp.route('/loans/my', methods=['GET'])
@jwt_required()
def my_loans():
    user_id = get_jwt_identity()
    loans = Loan.query.filter_by(user_id=user_id).all()

    loan_data = []
    for loan in loans:
        accrued = loan.compute_accrued_amount()
        loan_data.append({
            "loan_id": loan.id,
            "principal": loan.amount,
            "interest_rate": loan.interest_rate,
            "interest_frequency": loan.interest_frequency,
            "disbursed_on": loan.date,
            "outstanding": loan.outstanding,  # raw stored value
            "accrued_balance": accrued        # includes compound interest
        })

    return jsonify({"loans": loan_data}), 200