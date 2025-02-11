from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, WithdrawalStatus, db, Transaction, TransactionType, WithdrawalRequest, Contribution, WithdrawalVotes
import datetime
import math

withdrawal_bp = Blueprint("withdrawals",__name__)

@withdrawal_bp.route("/withdrawal/request", methods = ["POST"])
@jwt_required()
def withdraw_request():
    '''
    Allows only registered group admins to request for a withdrawal
    '''
    user_id = get_jwt_identity()
    registered_user = User.query.get(user_id)
    
   

    # Confirm if the request is made by a registered group admin
    if not registered_user or not registered_user.is_admin:
        return jsonify({"error": "Only registered group admins are allowed to withdraw"}), 403
    
    #Check whether each form is filled out
    data = request.get_json()
    amount = data['amount'] 
    reason = data['reason']

    if not amount or amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400
    
    if not reason:
        return jsonify({"error": "Reason is required"}), 400

    # check if there's an existing pending withdrawal request
    pending_withdrawal = WithdrawalRequest.query.filter_by(status=WithdrawalStatus.PENDING).first()
    if pending_withdrawal:
        return jsonify({"error": "A pending withdrawal already exists."}), 400

    total_contributions = db.session.query(db.func.sum(Contribution.amount)).scalar() or 0
    total_withdrawals = db.session.query(db.func.sum(Transaction.amount)).join(WithdrawalRequest, WithdrawalRequest.transaction_id == Transaction.id).filter(TransactionType == TransactionType.DEBIT, WithdrawalRequest.status == WithdrawalStatus.APPROVED).scalar() or 0

    available_balance = total_contributions - total_withdrawals

    # check for insufficient funds
    if amount > available_balance:
        return jsonify({"error": "Insufficient funds in the group account"}), 400
    

    #Creating a Transaction for withdrawal
    with db.session.begin_nested():
        withdrawal_transaction = Transaction(
            user_id = registered_user.id,
            amount = amount,
            type = TransactionType.DEBIT,
            reason = reason,
            date = datetime.datetime.now(datetime.timezone.utc),
            )


        db.session.add(withdrawal_transaction)
        db.session.flush()

        withdrawal_request = WithdrawalRequest(transaction_id=withdrawal_transaction.id)
        db.session.add(withdrawal_request)

    db.session.commit()

    return jsonify({"message": "Withdrawal logged successfully", "transaction_id" : withdrawal_transaction.id}), 201

@withdrawal_bp.route("/withdrawal/status", methods = ["GET"])
@jwt_required()
def get_withdrawal_status():
    '''
    Allows each user to view the pending and completed withdraw requests
    '''
    withdrawals = WithdrawalRequest.query.all()
   
    return jsonify([
        {"id": withdrawal.transaction_id, "amount": withdrawal.transaction.amount, "date": withdrawal.transaction.date, "status": withdrawal.status.value, "reason" : withdrawal.transaction.reason}
        for withdrawal in withdrawals
    ]), 200

@withdrawal_bp.route("/withdrawal/approve/<int:transaction_id>", methods = ["POST"])
@jwt_required()
def approve_withdrawal(transaction_id):
    '''
    Allows members of each group to approve a withdrawal
    '''
    
    user_id = get_jwt_identity()
    withdrawal = WithdrawalRequest.query.filter_by(transaction_id=transaction_id).first()

    if not withdrawal or withdrawal.status != WithdrawalStatus.PENDING:
        return jsonify({"error": "Withdrawal request not found or already processed"})
    
    #check if user has already voted
    existing_vote = WithdrawalVotes.query.filter_by(user_id=user_id, withdrawal_id=transaction_id).first()
    if existing_vote:
        return jsonify({"error": "You have already voted"}), 400
    
    # Register the vote
    vote = WithdrawalVotes(user_id=user_id, withdrawal_id=transaction_id, vote="approve")
    db.session.add(vote)

    # Approve the withdrawal
    withdrawal.approvals +=1
    total_members = User.query.count()
    if withdrawal.approvals > (total_members-1) / 2:
        withdrawal.status = WithdrawalStatus.APPROVED

    db.session.commit()
    return jsonify({
        "msg": "Your approval has been recorded",
        "total_approvals": withdrawal.approvals,
        "total_rejections": withdrawal.rejections,
        "status": withdrawal.status.value
        }), 201


@withdrawal_bp.route("/withdrawal/reject/<int:transaction_id>", methods = ["POST"])
@jwt_required()
def reject_withdrawal(transaction_id):
    '''
    Allows members of each group to reject a withdrawal.
    '''
    user_id = get_jwt_identity()
    withdrawal = WithdrawalRequest.query.filter_by(transaction_id=transaction_id).first()

    if not withdrawal or withdrawal.status != WithdrawalStatus.PENDING:
        return jsonify({"error": "Withdrawal request not found or already processed"}), 404

    # Check if the user has already voted
    existing_vote = WithdrawalVotes.query.filter_by(user_id=user_id, withdrawal_id=transaction_id).first()
    if existing_vote:
        return jsonify({"error": "You have already voted"}), 400

    # Register the vote
    vote = WithdrawalVotes(user_id=user_id, withdrawal_id=transaction_id, vote="reject")
    db.session.add(vote)
    withdrawal.rejections += 1

    # Check if rejection threshold is met
    total_members = User.query.count()
    if withdrawal.rejections > (total_members - 1) / 2:
        withdrawal.status = WithdrawalStatus.REJECTED

    db.session.commit()

    return jsonify({
        "message": "Your rejection has been recorded",
        "total_approvals": withdrawal.approvals,
        "total_rejections": withdrawal.rejections,
        "status": withdrawal.status.value
    }), 201