from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Group, Transaction, TransactionType, Loan, LoanStatus, WithdrawalRequest, WithdrawalStatus, TransactionReason, Contribution
import datetime
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

user_bp = Blueprint("user", __name__)

@user_bp.route("/user/account_summary", methods=["GET"])
@jwt_required()
def account_summary():
    print("Account summary endpoint hit!", flush=True)
    try:
        user_id = get_jwt_identity()
        logger.debug(f"Account summary requested for user_id={user_id}")

        user = User.query.get(user_id)
        if not user:
            logger.debug("User not found")
            return jsonify({"error": "User not found"}), 404

        if not user.group_id:
            logger.debug(f"User {user.id} not in a group")
            return jsonify({"error": "User not in a group"}), 400

        group = Group.query.get(user.group_id)
        if not group:
            logger.debug("Group not found")
            return jsonify({"error": "Group not found"}), 404
        
        now = datetime.datetime.now(datetime.timezone.utc)
        first_day = datetime.datetime(now.year, now.month, 1, tzinfo=datetime.timezone.utc)

        # --- Contributions (use Contribution table) ---
        monthly_contributed = db.session.query(db.func.sum(Contribution.amount)).filter(
            Contribution.user_id == user.id,
            Contribution.group_id == group.id,
            Contribution.date >= first_day,
            Contribution.date <= now
        ).scalar() or 0.0

        user_total_contributions = db.session.query(db.func.sum(Contribution.amount)).filter(
            Contribution.user_id == user.id,
            Contribution.group_id == group.id
        ).scalar() or 0.0

        group_total_contributions = db.session.query(db.func.sum(Contribution.amount)).filter(
            Contribution.group_id == group.id
        ).scalar() or 0.0

        group_monthly_contributions = db.session.query(db.func.sum(Contribution.amount)).filter(
            Contribution.group_id == group.id,
            Contribution.date >= first_day,
            Contribution.date <= now
        ).scalar() or 0.0

        # --- Required contributions ---
        daily_amount = group.daily_contribution_amount or 0
        required_so_far = daily_amount * now.day
        pending_amount = max(0, required_so_far - monthly_contributed)

        # --- Outstanding loan (user-specific) ---
        outstanding_loan = db.session.query(db.func.sum(Loan.outstanding)).filter(
            Loan.user_id == user.id,
            Loan.group_id == group.id,
            Loan.status == LoanStatus.DISBURSED
            ).scalar() or 0.0

        # --- Withdrawals made by admin (join WithdrawalRequest) ---
        total_withdrawals = db.session.query(db.func.sum(Transaction.amount)).join(
            WithdrawalRequest, WithdrawalRequest.transaction_id == Transaction.id
        ).filter(
            Transaction.group_id == group.id,
            Transaction.type == TransactionType.DEBIT,
            WithdrawalRequest.status.in_([WithdrawalStatus.COMPLETED, WithdrawalStatus.APPROVED])
        ).scalar() or 0.0

        # --- Loans disbursed & repaid via Transaction reasons ---
        total_loans_disbursed = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.group_id == group.id,
            Transaction.type == TransactionType.DEBIT,
            db.func.lower(Transaction.reason) == TransactionReason.LOAN_DISBURSEMENT
        ).scalar() or 0.0

        total_loans_repaid = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.group_id == group.id,
            Transaction.type == TransactionType.CREDIT,
            db.func.lower(Transaction.reason) == TransactionReason.LOAN_REPAYMENT
        ).scalar() or 0.0

        # Adjusted funds
        adjusted_group_funds = (
            (group_total_contributions or 0.0)
            - (total_withdrawals or 0.0)
            - (total_loans_disbursed or 0.0)
            + (total_loans_repaid or 0.0)
        )



        logger.debug(f"Adjusted group funds: {adjusted_group_funds}")

        # --- Loan limit ---
        loan_limit = 0.0
        percentage_share = 0.0
        if group_total_contributions > 0 and user_total_contributions > 0 and adjusted_group_funds > 0:
            percentage_share = (user_total_contributions / group_total_contributions) * 100
            available_company_limit = 0.4 * adjusted_group_funds
            loan_limit = (user_total_contributions / group_total_contributions) * available_company_limit
        logger.debug(f"Loan limit: {loan_limit}, Share: {percentage_share}%")

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

    except Exception as e:
        import traceback
        print("Error in account_summary:", str(e), flush=True)
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500