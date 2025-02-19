from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Contribution, Transaction, User, ContributionStatus, TransactionType
import datetime

contributions_bp = Blueprint('contributions', __name__)


def log_contribution(user_id, amount, receipt_number):
    """Logs a contribution and its associated transaction."""
    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404
    
    try:
        amount = float(amount)
        if amount <= 0:
            return {"error": "Invalid contribution amount"}, 400
    except ValueError:
        return {"error": "Amount must be a valid number"}, 400
    
    try:
        contribution = Contribution(
            user_id=user_id,
            amount=amount,
            date=datetime.date.today(),
            status=ContributionStatus.PAID
        )

        transaction = Transaction(
            user_id=user_id,
            amount=amount,
            type=TransactionType.CREDIT,
            reason="Contribution",
            date=datetime.datetime.now(datetime.timezone.utc),
            reference=receipt_number
        )

        db.session.add(contribution)
        db.session.add(transaction)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return {"error": f"Database error: {str(e)}"}, 500

    return {"message": "Contribution logged successfully!",
            "contribution_id": contribution.id,
            "transaction_id": transaction.id,
        }, 201

@contributions_bp.route('/contribute', methods=['POST'])
@jwt_required()
def contribute():
    """Allow a user to log a manual contribution."""
    user_id = get_jwt_identity()
    data = request.get_json()
    amount = data.get('amount')
    receipt_number = data.get('receipt_number')

    if not amount or not receipt_number:
        return jsonify({"error": "Missing required fields"}), 400

    response, status_code = log_contribution(user_id, amount, receipt_number)
    return jsonify(response), status_code


@contributions_bp.route('/contributions', methods=['GET'])
@jwt_required()
def get_contributions():
    """Retrieve all contributions made by the logged-in user."""
    user_id = get_jwt_identity()
    contributions = Contribution.query.filter_by(user_id=user_id).all()

    return jsonify([{
        "id": contribution.id,
        "amount": contribution.amount,
        "date": contribution.date.strftime("%Y-%m-%d %H:%M:%S"),
        "status": contribution.status.value
    } for contribution in contributions]), 200


@contributions_bp.route('/contributions/total', methods=['GET'])
@jwt_required()
def get_total_contributions():
    """Retrieve the total amount contributed by all users."""
    try:
        total = db.session.query(db.func.sum(Contribution.amount)).scalar() or 0
        return jsonify({"total_contributions": total}), 200
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500