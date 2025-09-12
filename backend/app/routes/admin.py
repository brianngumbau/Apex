from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Group, Transaction, TransactionType, Loan, LoanStatus, WithdrawalRequest, WithdrawalStatus, Notification, GroupJoin, GroupJoinRequest
import datetime, calendar

admin_bp = Blueprint("admin", __name__)


# Set Daily Contribution Amount
@admin_bp.route("/groups/<int:group_id>/set_daily_amount", methods=["POST"])
@jwt_required()
def set_daily_amount(group_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404
    
    if group.admin_id != user.id:
        return jsonify({"error": "Only the group admin can set this"}), 403
    
    data = request.get_json() or {}
    amount = data.get("amount")

    if not amount or float(amount) <= 0:
        return jsonify({"error": "Invalid amount"}), 400
    
    group.daily_contribution_amount = float(amount)
    db.session.commit()

    # Notify all members except admin
    members = group.members
    for member in members:
        if member.id == user.id:
            continue
        notif = Notification(
            user_id=member.id,
            group_id=group.id,
            message=f"The daily contribution has been set to Ksh {amount} by {user.name}",
            type="Daily Contribution update",
            date=datetime.datetime.now(datetime.timezone.utc)  # fixed typo: was "dete"
        )
        db.session.add(notif)

    db.session.commit()

    return jsonify({"message": f"Daily contribution set to {amount} for {group.name}"}), 200


#  Admin Dashboard
@admin_bp.route("/groups/<int:group_id>/admin_dashboard", methods=["GET"])
@jwt_required()
def get_admin_dashboard(group_id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    # Always enforce admin’s own group
    if not user.group_id:
        return jsonify({"error": "Admin is not assigned to any group"}), 400

    group = Group.query.get(user.group_id)

    print("JWT user_id:", type(user_id))
    print("Group admin_id:", type(group.admin_id))


    if not group:
        return jsonify({"error": "Group not found"}), 404
    if group.admin_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    


    # Daily requirement
    daily_amount = group.daily_contribution_amount or 0
    now = datetime.datetime.now(datetime.timezone.utc)
    first_day = datetime.datetime(now.year, now.month, 1, tzinfo=datetime.timezone.utc)
    required_so_far = daily_amount * now.day

    members_data = []
    for member in group.members:
        total_contributed = db.session.query(db.func.sum(Transaction.amount)) \
            .filter(
                Transaction.user_id == member.id,
                Transaction.group_id == group.id,
                Transaction.type == TransactionType.CREDIT,
                Transaction.date >= first_day,
                Transaction.date <= now
            ).scalar() or 0.0

        members_data.append({
            "member_id": member.id,
            "name": member.name,
            "total_contributed": total_contributed,
            "required_so_far": required_so_far,
            "status": "met" if total_contributed >= required_so_far else "pending"
        })

    pending_loans = Loan.query.filter_by(group_id=group.id, status=LoanStatus.PENDING).all()
    loans_data = [{
        "loan_id": loan.id,
        "member_id": loan.user_id,
        "member_name": loan.borrower.name,
        "amount": loan.amount,
        "date": loan.date.isoformat()
    } for loan in pending_loans]

    pending_withdrawals = WithdrawalRequest.query.filter_by(group_id=group.id, status=WithdrawalStatus.PENDING).all()
    withdrawals_data = [{
        "withdrawal_id": w.id,
        "transaction_id": w.transaction_id,
        "amount": w.transaction.amount,
        "requested_by": w.transaction.user.name if w.transaction.user else None,
        "approvals": w.approvals,
        "rejections": w.rejections,
        "date": w.transaction.date.isoformat()
    } for w in pending_withdrawals]


    pending_join_requests = GroupJoinRequest.query.filter_by(group_id=group.id, status=GroupJoin.PENDING).all()

    join_requests_data = [
        {
            "id": req.id,
            "user_id": req.user_id,
            "user_name": req.user.name,
            "date": req.date.isoformat()
        } for req in pending_join_requests
    ]


    response = {
        "group_id": group.id,
        "group_name": group.name,
        "join_code": group.join_code,
        "daily_contribution_amount": daily_amount,
        "required_so_far": required_so_far,
        "month": now.strftime("%B %Y"),
        "members": members_data,
        "pending_loans": loans_data,
        "pending_withdrawals": withdrawals_data,
        "pending_join_requests": join_requests_data
    }

    return jsonify(response), 200


# Approve Loan
@admin_bp.route("/groups/<int:group_id>/loans/<int:loan_id>/approve", methods=["POST"])
@jwt_required()
def approve_loan(group_id, loan_id):
    user_id = int(get_jwt_identity())
    admin = User.query.get(user_id)
    group = Group.query.get(group_id)

    print("Admin user_id:", user_id)
    print("Admin.is_admin:", admin.is_admin)
    print("Group admin_id:", group.admin_id)


    if not admin or not admin.is_admin or not group or group.admin_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    loan = Loan.query.get(loan_id)
    if not loan or loan.group_id != group.id or loan.status != LoanStatus.PENDING:
        return jsonify({"error": "Loan not found or already processed"}), 404

    # approve
    loan.status = LoanStatus.APPROVED
    loan.approved_by = admin.id
    db.session.commit()

    notif = Notification(
        user_id=loan.user_id,
        group_id=group.id,
        message=f"Your loan of Ksh {loan.amount} has been approved by {admin.name}",
        type="Loan approval",
        date=datetime.datetime.now(datetime.timezone.utc)
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({"message": f"Loan {loan.id} approved"}), 200