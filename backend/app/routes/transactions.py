from flask import Blueprint, request, jsonify
from models import db, Transaction, User, TransactionType
from utils.jwt_handler import decode_jwt

transactions_bp = Blueprint("transactions", __name__)

@transactions_bp.route("/transactions", methods=["GET"])
def get_all_transactions():
    """
    Fetch all transactions for the group
    """

    transactions = Transaction.query.all()

    return jsonify([
        {"id": transaction.id, "user_id": transaction.user_id, "amount": transaction.amount, "type": transaction.type.value, "reason": transaction.reason, "date": transaction.date.strftime("%Y-%m-%d %H:%M:%S")}
        for transaction in transactions
    ]), 200


@transactions_bp.route("/transactions/<int:user_id>", methods=["GET"])
def get_user_transactions(user_id):
    """
    Fetch all transactions for a specific user
    """

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    transactions = Transaction.query.filter_by(user_id=user_id).all()

    return jsonify([
        {"id": transaction.id, "amount": transaction.amount, "type": transaction.type.value, "reason": transaction.reason, "date": transaction.date.strftime("%Y-%m-%d %H:%M:%S")}
        for transaction in transactions
    ])