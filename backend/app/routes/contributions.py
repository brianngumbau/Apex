from flask import Blueprint, request, jsonify
from models import Contribution, User, db, ContributionStatus
from utils.jwt_handler import decode_jwt
from datetime import date

contributions_bp = Blueprint('contributions', __name__)

@contributions_bp.route("/contribute", methods=["POST"])
def contribute():
    """
    Allows a user to log a manual contribution
    """

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer"):
        return jsonify({"error": "Token is missing or invalid"}), 401

    token = auth_header.split(" ")[1]
    user_id = decode_jwt(token)
    if not user_id:
        return jsonify({"error": "Invalid token"}), 401

    data = request.get_json()
    if "amount" not in data:
        return jsonify({"error": "Amount is required"}), 400

    amount = data["amount"]

    #Ensure the user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # logging the contribution
    new_contribution = Contribution(
        user_id=user.id,
        amount=amount,
        date=date.today(),
        status=ContributionStatus.PAID
    )

    db.session.add(new_contribution)
    db.session.commit()

    return jsonify({"message": "Contribution logged successfully"}), 201


@contributions_bp.route("/contributions", methods=["GET"])
def get_contributions():
    """
    Retrieve all contributions made by authenticated user
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer"):
        return jsonify({"error": "Token is missing or invalid"}), 401

    token = auth_header.split(" ")[1]
    user_id = decode_jwt(token)
    if not user_id:
        return jsonify({"error": "Invalid token"}), 401

    contributions = Contribution.query.filter_by(user_id=user_id).all()

    return jsonify([
        {"id": contribution.id, "amount": contribution.amount, "date": contribution.date.strftime("%Y-%m-%d"), "status": contribution.status.value}
        for contribution in contributions
    ]), 200

@contributions_bp.route("/contributions/total", methods=["GET"])
def get_total_contributions():
    """
    Retrieve the total amount contributed by all members
    """
    total = db.session.query(db.func.sum(Contribution.amount)).scalar or 0

    return jsonify({"total_contributions": total}), 200