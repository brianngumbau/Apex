from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Contribution, Transaction, User, ContributionStatus, TransactionType
import datetime

contributions_bp = Blueprint('contributions', __name__)

@contributions_bp.route('/contribute', methods=['POST'])
@jwt_required()
def contribute():
    """Allow a user to log a manual contribution and log it as a transaction."""
    user_id = get_jwt_identity()
    data = request.get_json()
    amount = data.get('amount')
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Log the contribution
    contribution = Contribution(
        user_id=user_id,
        amount=amount,
        date=datetime.date.today(),
        status=ContributionStatus.PAID
    )

    # Log the transaction (as a credit)
    transaction = Transaction(
        user_id=user_id,
        amount=amount,
        type=TransactionType.CREDIT,
        reason="Contribution",
        date=datetime.datetime.now(datetime.timezone.utc)
    )

    db.session.add(contribution)
    db.session.add(transaction)
    db.session.commit()

    return jsonify({"message": "Contribution logged successfully!", "contribution_id": contribution.id, "transaction_id": transaction.id}), 201


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
    total = db.session.query(db.func.sum(Contribution.amount)).scalar() or 0
    return jsonify({"total_contributions": total}), 200