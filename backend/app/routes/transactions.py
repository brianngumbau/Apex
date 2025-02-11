from flask import Blueprint, request, jsonify
from models import db, Transaction, User, TransactionType
from flask_jwt_extended import jwt_required, get_jwt_identity

transactions_bp = Blueprint("transactions", __name__)

@transactions_bp.route("/transactions", methods=["GET"])
@jwt_required()
def get_all_transactions():
    """
    Fetch all transactions for the group(Admin only)
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    if not user.is_admin:
        return jsonify({"error": "Only admins can view all transactions"}), 403

    transactions = Transaction.query.order_by(Transaction.date.desc()).all()

    return jsonify([
        {
            "id": transaction.id,
            "user_id": transaction.user_id,
            "amount": transaction.amount,
            "type": transaction.type.value,
            "reason": transaction.reason,
            "date": transaction.date.strftime("%Y-%m-%d %H:%M:%S")
        }
        for transaction in transactions
    ]), 200


@transactions_bp.route("/transactions/user", methods=["GET"])
@jwt_required()
def get_user_transactions():
    """
    Fetch all transactions for a specific user
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.date.desc()).all()

    return jsonify([
        {
            "id": transaction.id,
            "amount": transaction.amount,
            "type": transaction.type.value,
            "reason": transaction.reason,
            "date": transaction.date.strftime("%Y-%m-%d %H:%M:%S")
        }
        for transaction in transactions
    ])