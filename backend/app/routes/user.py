from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Group, Transaction, TransactionType, Loan, LoanStatus
import datetime

user_bp = Blueprint("user", __name__)

@user_bp.route("/user/account_summary", methods=["GET"])
@jwt_required()
def account_summary():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.group_id:
        return jsonify({"error": "User not in a group"}), 400

    group = Group.query.get(user.group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404

    now = datetime.datetime.now(datetime.timezone.utc)
    first_day = datetime.datetime(now.year, now.month, 1, tzinfo=datetime.timezone.utc)

    # Total contributed by user (this month)
    monthly_contributed = db.session.query(db.func.sum(Transaction.amount)) \
        .filter(
            Transaction.user_id == user.id,
            Transaction.group_id == group.id,
            Transaction.type == TransactionType.CREDIT,
            Transaction.date >= first_day,
            Transaction.date <= now
        ).scalar() or 0.0

    # All-time contributions by user
    user_total_contributions = db.session.query(db.func.sum(Transaction.amount)) \
        .filter(
            Transaction.user_id == user.id,
            Transaction.group_id == group.id,
            Transaction.type == TransactionType.CREDIT
        ).scalar() or 0.0

    # All-time contributions by group
    group_total_contributions = db.session.query(db.func.sum(Transaction.amount)) \
        .filter(
            Transaction.group_id == group.id,
            Transaction.type == TransactionType.CREDIT
        ).scalar() or 0.0

    # Monthly group contributions
    group_monthly_contributions = db.session.query(db.func.sum(Transaction.amount)) \
        .filter(
            Transaction.group_id == group.id,
            Transaction.type == TransactionType.CREDIT,
            Transaction.date >= first_day,
            Transaction.date <= now
        ).scalar() or 0.0

    # Required contributions so far
    daily_amount = group.daily_contribution_amount or 0
    required_so_far = daily_amount * now.day
    pending_amount = max(0, required_so_far - monthly_contributed)

    # Outstanding loan (user-specific)
    outstanding_loan = db.session.query(db.func.sum(Loan.outstanding)) \
        .filter(
            Loan.user_id == user.id,
            Loan.group_id == group.id,
            Loan.status.in_([LoanStatus.DISBURSED, LoanStatus.APPROVED])
        ).scalar() or 0.0

    
    # Adjusted group funds

    # Withdrawals made by admin
    total_withdrawals = db.session.query(db.func.sum(Transaction.amount)) \
        .filter(
            Transaction.group_id == group.id,
            Transaction.type == TransactionType.DEBIT,
            Transaction.reason == "withdrawal"
        ).scalar() or 0.0

    # Loans disbursed
    total_loans_disbursed = db.session.query(db.func.sum(Transaction.amount)) \
        .filter(
            Transaction.group_id == group.id,
            Transaction.reason == "loan_disbursement"
        ).scalar() or 0.0

    # Loan repayments
    total_loans_repaid = db.session.query(db.func.sum(Transaction.amount)) \
        .filter(
            Transaction.group_id == group.id,
            Transaction.reason == "loan_repayment"
        ).scalar() or 0.0

    adjusted_group_funds = (
        group_total_contributions
        - total_withdrawals
        - total_loans_disbursed
        + total_loans_repaid
    )

    # Loan limit (same as request_loan formula)
    loan_limit = 0.0
    percentage_share = 0.0
    if group_total_contributions > 0 and user_total_contributions > 0 and adjusted_group_funds > 0:
        percentage_share = (user_total_contributions / group_total_contributions) * 100
        available_company_limit = 0.4 * adjusted_group_funds
        loan_limit = (user_total_contributions / group_total_contributions) * available_company_limit


    return jsonify({
        "group_name": group.name,
        "month": now.strftime("%B %Y"),
        "daily_amount": float(daily_amount),
        "monthly_contributed": float(monthly_contributed),
        "required_so_far": float(required_so_far),
        "pending_amount": float(pending_amount),
        "outstanding_loan": float(outstanding_loan),
        "group_total_contributions": float(group_total_contributions),
        "group_monthly_contributions": float(group_monthly_contributions),
        "adjusted_group_funds": float(adjusted_group_funds),
        "user_total_contributions": float(user_total_contributions),
        "percentage_share": round(percentage_share, 2),
        "loan_limit": round(loan_limit, 2)
    }), 200