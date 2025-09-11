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

    # Total contributed this month
    total_contributed = db.session.query(db.func.sum(Transaction.amount)) \
        .filter(
            Transaction.user_id == user.id,
            Transaction.group_id == group.id,
            Transaction.type == TransactionType.CREDIT,
            Transaction.date >= first_day,
            Transaction.date <= now
        ).scalar() or 0.0

    # Required contributions (based on daily amount set by admin)
    daily_amount = group.daily_contribution_amount or 0
    required_so_far = daily_amount * now.day
    pending_amount = max(0, required_so_far - total_contributed)

    # Outstanding loan
    outstanding_loan = db.session.query(db.func.sum(Loan.outstanding)) \
        .filter(
            Loan.user_id == user.id,
            Loan.group_id == group.id,
            Loan.status.in_([LoanStatus.DISBURSED, LoanStatus.APPROVED])
        ).scalar() or 0.0

    return jsonify({
        "group_name": group.name,
        "month": now.strftime("%B %Y"),
        "daily_amount": float(daily_amount),
        "total_contributed": float(total_contributed),
        "required_so_far": float(required_so_far),
        "pending_amount": float(pending_amount),
        "outstanding_loan": float(outstanding_loan)
    }), 200