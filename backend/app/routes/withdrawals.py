from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, WithdrawalStatus, db, Transaction, TransactionType, WithdrawalRequest
import datetime


withdrawal_bp = Blueprint("withdrawals",__name__)

@withdrawal_bp.route("/withdraw/request", methods = ["POST"])
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
        return jsonify({"error": "Invalid amount"}), 401 #To be confirmed
    
    #Creating a Trasnsaction instance
    withdrawal_transaction = Transaction(
        user_id = registered_user.user_id,
        amount = amount,
        type = TransactionType.DEBIT,
        reason = reason,
        date = datetime.datetime.now(datetime.timezone.utc),
        )
    

    db.session.add(withdrawal_transaction)
    db.session.commit()

    withdrawal_request = WithdrawalRequest(
        transaction_id = withdrawal_transaction.id,
    )

    db.session.add(withdrawal_request)
    db.session.commit()

    return jsonify({"message": "Withdrawal logged successfully", "transaction_id" : withdrawal_transaction.id}), 201

@withdrawal_bp.route("/withdraw/status", methods = ["GET"])
@jwt_required()
def get_withdrawal_status():
    '''
    Allows each user to view the pending and completed withdraw requests
    '''
    withdrawals = WithdrawalRequest.query.all()
   
    return jsonify([
        {"id": withdrawal.transaction_id, "amount": withdrawal.amount, "date": withdrawal.created_at, "status": withdrawal.status.value, "reason" : withdrawal.reason}
        for withdrawal in withdrawals
    ]), 200

@withdrawal_bp.route("/withdrawals/approve/<int:transaction_id>", methods = ["POST"])
@jwt_required()
def approve_withdrawal(transaction_id):
    '''
    Allows members of each group to approve a withdrawal
    '''

    #Verifying the transaction id
    
    transaction = Transaction.query.filter_by(id = transaction_id).first()
    withdrawals = transaction.withdrawal_request

    for withdrawal in withdrawals:
        if not withdrawal or withdrawal.status != WithdrawalStatus.PENDING:
            return jsonify({"error": "Withdrawal request not found or already processed"})
        # Approve the withdrawal
        withdrawal.approvals +=1
        total_members = User.query.count()
        if withdrawal.approvals > (total_members-1) / 2:
            withdrawal.status = WithdrawalStatus.APPROVED

    db.session.commit()
    return jsonify({"msg": "Successfully approved!"}), 201


@withdrawal_bp.route("/withdrawals/reject/<int:transaction_id>", methods = ["POST"])
@jwt_required()
def reject_withdrawal(transaction_id):
    '''
    Allows members of each group to reject a withdrawal
    '''

    #Verifying the transaction id
    
    transaction = Transaction.query.filter_by(id = transaction_id).first()
    withdrawals = transaction.withdrawal_request

    for withdrawal in withdrawals:
        if not withdrawal or withdrawal.status != WithdrawalStatus.PENDING:
            return jsonify({"error": "Withdrawal request not found or already processed"})
        # Approve the withdrawal
        withdrawal.rejections +=1
        total_members = User.query.count()
        if withdrawal.rejections > (total_members-1) / 2:
            withdrawal.status = WithdrawalStatus.REJECTED

    db.session.commit()
    return jsonify({"msg": "Successfully rejected!"}), 201





    
    
