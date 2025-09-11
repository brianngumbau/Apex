from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import (
    User, WithdrawalStatus, db, Transaction,
    TransactionType, WithdrawalRequest, Contribution,
    WithdrawalVotes, Notification
)
import datetime
import logging
from flask_socketio import emit, join_room
from app.extensions import socketio

withdrawal_bp = Blueprint("withdrawals", __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------- SOCKET HANDLERS ---------------- #
@socketio.on("join_group")
def handle_join_group(data):
    """Allow a client to join their group's room for real-time updates."""
    group_id = data.get("group_id")
    if group_id:
        join_room(f"group_{group_id}")
        logger.info(f"Client joined room group_{group_id}")


# ---------------- WITHDRAWAL ROUTES ---------------- #
@withdrawal_bp.route("/withdrawal/request", methods=["POST"])
@jwt_required()
def withdraw_request():
    """
    Allows only registered group admins to request a withdrawal.
    """
    user_id = int(get_jwt_identity())
    registered_user = User.query.get(user_id)

    if not registered_user or not registered_user.is_admin:
        logger.warning(f"Unauthorized withdrawal request attempt by user ID: {user_id}")
        return jsonify({"error": "Only registered group admins are allowed to withdraw"}), 403

    data = request.get_json()
    amount = data.get("amount")
    reason = data.get("reason")

    if not amount or amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400
    if not reason:
        return jsonify({"error": "Reason is required"}), 400

    group_id = registered_user.group_id

    # Check for existing pending withdrawal
    pending_withdrawal = WithdrawalRequest.query.filter_by(group_id=group_id, status=WithdrawalStatus.PENDING).first()
    if pending_withdrawal:
        return jsonify({"error": "A pending withdrawal already exists"}), 400

    # Compute available balance
    total_contributions = db.session.query(db.func.sum(Contribution.amount)).filter_by(group_id=group_id).scalar() or 0
    total_withdrawals = db.session.query(db.func.sum(Transaction.amount)).join(
        WithdrawalRequest, WithdrawalRequest.transaction_id == Transaction.id, isouter=True
    ).filter(
        Transaction.type == TransactionType.DEBIT,
        db.or_(WithdrawalRequest.status == WithdrawalStatus.COMPLETED, WithdrawalRequest.status.is_(None)),
        Transaction.group_id == group_id
    ).scalar()

    available_balance = total_contributions - float(total_withdrawals or 0)

    if amount > available_balance:
        logger.info(
            f"Withdrawal request denied due to insufficient funds. "
            f"Group ID: {group_id}, Requested: {amount}, Available: {available_balance}"
        )
        return jsonify({"error": f"Insufficient funds in the group account. Available {available_balance}"}), 400

    try:
        with db.session.begin_nested():
            withdrawal_transaction = Transaction(
                user_id=registered_user.id,
                group_id=group_id,
                amount=amount,
                type=TransactionType.DEBIT,
                reason=reason,
                date=datetime.datetime.now(datetime.timezone.utc)
            )
            db.session.add(withdrawal_transaction)
            db.session.flush()

            withdrawal_request = WithdrawalRequest(
                transaction_id=withdrawal_transaction.id,
                mpesa_transaction_id=None,
                group_id=group_id
            )
            db.session.add(withdrawal_request)

            group_members = User.query.filter_by(group_id=group_id).all()
            for member in group_members:
                notification = Notification(
                    user_id=member.id,
                    group_id=group_id,
                    message=f"A withdrawal request of ksh {amount} has been initiated",
                    type="Withdrawal request",
                    date=datetime.datetime.now(datetime.timezone.utc)
                )
                db.session.add(notification)

        db.session.commit()

        # Emit to all group members in real-time
        socketio.emit(
            "withdrawal_created",
            {
                "id": withdrawal_request.id,
                "amount": withdrawal_transaction.amount,
                "date": withdrawal_transaction.date.strftime("%Y-%m-%d %H:%M:%S"),
                "status": withdrawal_request.status.value,
                "reason": withdrawal_transaction.reason,
                "requested_by": withdrawal_transaction.user.name,
            },
            room=f"group_{group_id}"
        )

        logger.info(f"Withdrawal request created by Admin ID: {user_id} for Group ID: {group_id}")

        return jsonify({
            "message": "Withdrawal logged successfully",
            "withdrawal_id": withdrawal_request.id,
            "transaction_id": withdrawal_transaction.id
        }), 201

    except Exception as e:
        logger.error(f"Error processing withdrawal request: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while processing the withdrawal"}), 500


@withdrawal_bp.route("/withdrawal/status", methods=["GET"])
@jwt_required()
def get_withdrawal_status():
    """
    Allows each user to view pending and completed withdrawal requests.
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        logger.warning(f"User ID {user_id} not found while requesting withdrawal status")
        return jsonify({"error": "User not found"}), 404

    group_id = user.group_id
    withdrawals = WithdrawalRequest.query.filter_by(group_id=group_id).all()

    if not withdrawals:
        return jsonify({"message": "No withdrawal requests found"}), 200
    
    logger.info(f"User {user.id} requesting status for group {group_id}")
    logger.info(f"Withdrawals found: {[w.id for w in withdrawals]}")


    return jsonify([
        {
            "id": withdrawal.id,
            "amount": withdrawal.transaction.amount,
            "date": withdrawal.transaction.date.strftime("%Y-%m-%d %H:%M:%S"),
            "status": withdrawal.status.value,
            "reason": withdrawal.transaction.reason,
            "requested_by": withdrawal.transaction.user.name if withdrawal.transaction.user else "Unknown"
        }
        for withdrawal in withdrawals
    ]), 200


@withdrawal_bp.route("/withdrawal/approve/<int:withdrawal_id>", methods=["POST"])
@jwt_required()
def approve_withdrawal(withdrawal_id):
    """
    Allows members of a group to approve a withdrawal.
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    group_id = user.group_id
    withdrawal = WithdrawalRequest.query.get(withdrawal_id)

    if not withdrawal or withdrawal.status != WithdrawalStatus.PENDING:
        return jsonify({"error": "Withdrawal request not found or already processed"}), 404

    # Check if user has already voted
    existing_vote = WithdrawalVotes.query.filter_by(user_id=user_id, withdrawal_id=withdrawal.id, group_id=group_id).first()
    if existing_vote:
        return jsonify({"error": "You have already voted"}), 400

    # Register approval vote
    vote = WithdrawalVotes(user_id=user_id, withdrawal_id=withdrawal.id, group_id=group_id, vote="approve")
    db.session.add(vote)

    total_approvals = db.session.query(db.func.count()).filter(
        WithdrawalVotes.withdrawal_id == withdrawal.id,
        WithdrawalVotes.group_id == group_id,
        WithdrawalVotes.vote == "approve"
    ).scalar()

    withdrawal.approvals = total_approvals
    total_members = User.query.filter_by(group_id=group_id).count()

    if total_approvals > total_members // 2:
        withdrawal.status = WithdrawalStatus.APPROVED

        group_members = User.query.filter_by(group_id=group_id).all()
        for member in group_members:
            notification = Notification(
                user_id=member.id,
                group_id=group_id,
                message=f"The withdrawal request of ksh {withdrawal.transaction.amount} has been approved",
                type="Withdrawal request approval",
                date=datetime.datetime.now(datetime.timezone.utc)
            )
            db.session.add(notification)

    db.session.commit()

    socketio.emit(
        "withdrawal_updated",
        {
            "id": withdrawal.id,
            "status": withdrawal.status.value,
            "total_approvals": withdrawal.approvals,
            "total_rejections": withdrawal.rejections
        },
        room=f"group_{group_id}"
    )

    logger.info(f"User {user_id} approved withdrawal {withdrawal_id}")

    return jsonify({
        "message": "Your approval has been recorded",
        "total_approvals": withdrawal.approvals,
        "total_rejections": withdrawal.rejections,
        "status": withdrawal.status.value
    }), 201


@withdrawal_bp.route("/withdrawal/reject/<int:withdrawal_id>", methods=["POST"])
@jwt_required()
def reject_withdrawal(withdrawal_id):
    """
    Allows members of a group to reject a withdrawal.
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    group_id = user.group_id
    withdrawal = WithdrawalRequest.query.get(withdrawal_id)

    if not withdrawal or withdrawal.status != WithdrawalStatus.PENDING:
        return jsonify({"error": "Withdrawal request not found or already processed"}), 404

    existing_vote = WithdrawalVotes.query.filter_by(user_id=user_id, withdrawal_id=withdrawal.id, group_id=group_id).first()
    if existing_vote:
        return jsonify({"error": "You have already voted"}), 400

    vote = WithdrawalVotes(user_id=user_id, withdrawal_id=withdrawal.id, group_id=group_id, vote="reject")
    db.session.add(vote)

    total_rejections = db.session.query(db.func.count()).filter(
        WithdrawalVotes.withdrawal_id == withdrawal.id,
        WithdrawalVotes.group_id == group_id,
        WithdrawalVotes.vote == "reject"
    ).scalar()

    withdrawal.rejections = total_rejections
    total_members = User.query.filter_by(group_id=group_id).count()

    if total_rejections > total_members // 2:
        withdrawal.status = WithdrawalStatus.REJECTED

        group_members = User.query.filter_by(group_id=group_id).all()
        for member in group_members:
            notification = Notification(
                user_id=member.id,
                group_id=group_id,
                message=f"The withdrawal request of ksh {withdrawal.transaction.amount} was rejected",
                type="Withdrawal request rejection",
                date=datetime.datetime.now(datetime.timezone.utc)
            )
            db.session.add(notification)

    db.session.commit()

    socketio.emit(
        "withdrawal_updated",
        {
            "id": withdrawal.id,
            "status": withdrawal.status.value,
            "total_approvals": withdrawal.approvals,
            "total_rejections": withdrawal.rejections
        },
        room=f"group_{group_id}"
    )

    logger.info(f"User {user_id} rejected withdrawal {withdrawal_id}")

    return jsonify({
        "message": "Your rejection has been recorded",
        "total_approvals": withdrawal.approvals,
        "total_rejections": withdrawal.rejections,
        "status": withdrawal.status.value
    }), 201


@withdrawal_bp.route("/withdrawals/group", methods=["GET"])
@jwt_required()
def get_group_withdrawals():
    """
    Allows the group admin to view all withdrawal requests in their group.
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user or not user.is_admin:
        return jsonify({"error": "Unauthorized"}), 403

    group_id = user.group_id
    withdrawals = WithdrawalRequest.query.filter_by(group_id=group_id).all()

    if not withdrawals:
        return jsonify({"message": "No withdrawals found"}), 200

    return jsonify([
        {
            "id": w.id,
            "amount": w.transaction.amount,
            "date": w.transaction.date.strftime("%Y-%m-%d %H:%M:%S"),
            "status": w.status.value,
            "reason": w.transaction.reason,
            "requested_by": w.transaction.user.name if w.transaction.user else "Unknown"
        }
        for w in withdrawals
    ]), 200

@withdrawal_bp.route("/withdrawals/<int:withdrawal_id>/cancel", methods=["POST"])
@jwt_required()
def cancel_withdrawal(withdrawal_id):
    """
    Allows an admin to cancel a pending withdrawal request.
    """
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user or not user.is_admin:
        return jsonify({"error": "Unauthorized"}), 403

    withdrawal = WithdrawalRequest.query.get(withdrawal_id)
    if not withdrawal:
        return jsonify({"error": "Withdrawal not found"}), 404

    if withdrawal.group_id != user.group_id:
        return jsonify({"error": "Cannot cancel withdrawal from another group"}), 403

    if withdrawal.status != WithdrawalStatus.PENDING:
        return jsonify({"error": "Only pending withdrawals can be cancelled"}), 400

    try:
        # Mark as cancelled
        withdrawal.status = WithdrawalStatus.CANCELLED
        db.session.commit()

        # Emit socket event for real-time updates
        socketio.emit(
            "withdrawal_updated",
            {
                "id": withdrawal.id,
                "amount": withdrawal.transaction.amount,
                "requested_by": withdrawal.transaction.user.name,
                "status": withdrawal.status.value,
                "approvals": withdrawal.approvals,
                "rejections": withdrawal.rejections
            },
            room=f"group_{user.group_id}"
        )

        return jsonify({"message": f"Withdrawal {withdrawal.id} cancelled successfully!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to cancel withdrawal: {str(e)}"}), 500