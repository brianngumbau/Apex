from flask import Blueprint, request, jsonify
from models import db, Transaction, User, TransactionType
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging

transactions_bp = Blueprint("transactions", __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@transactions_bp.route("/transactions", methods=["GET"])
@jwt_required()
def get_all_transactions():
    """
    Fetch all transactions for the group (Admin only)
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        logger.warning(f"Unauthorized access attempt by invalid user ID: {user_id}")
        return jsonify({"error": "User not found"}), 404

    if not user.is_admin:
        logger.warning(f"Unauthorized access attempt by non-admin user ID: {user_id}")
        return jsonify({"error": "Only admins can view all transactions"}), 403

    try:
        transactions = Transaction.query.filter_by(group_id=user.group_id).order_by(Transaction.date.desc()).all()

        if not transactions:
            return jsonify({"message": "No transactions found"}), 200

        logger.info(f"Admin user {user_id} retrieved all transactions for group {user.group_id}")

        return jsonify([
            {
                "id": transaction.id,
                "user_id": transaction.user_id,
                "group_id": transaction.group_id,
                "amount": transaction.amount,
                "type": transaction.type.value,
                "reason": transaction.reason,
                "date": transaction.date.strftime("%Y-%m-%d %H:%M:%S")
            }
            for transaction in transactions
        ]), 200
    except Exception as e:
        logger.error(f"Database error while fetching transactions: {str(e)}")
        return jsonify({"error": "Database error occurred"}), 500


@transactions_bp.route("/transactions/user", methods=["GET"])
@jwt_required()
def get_user_transactions():
    """
    Fetch all transactions for the logged-in user
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        logger.warning(f"User not found: {user_id}")
        return jsonify({"error": "User not found"}), 404

    try:
        transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.date.desc()).all()

        if not transactions:
            return jsonify({"message": "No transactions found"}), 200

        logger.info(f"User {user_id} retrieved their transactions")

        return jsonify([
            {
                "id": transaction.id,
                "group_id": transaction.group_id,
                "amount": transaction.amount,
                "type": transaction.type.value,
                "reason": transaction.reason,
                "date": transaction.date.strftime("%Y-%m-%d %H:%M:%S")
            }
            for transaction in transactions
        ]), 200
    except Exception as e:
        logger.error(f"Database error while fetching transactions for user {user_id}: {str(e)}")
        return jsonify({"error": "Database error occurred"}), 500