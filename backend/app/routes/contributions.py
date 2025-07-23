from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Contribution, Transaction, User, ContributionStatus, TransactionType, Notification
import datetime
import logging


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

contributions_bp = Blueprint('contributions', __name__)

def log_contribution(user_id, amount, receipt_number):
    """Logs a contribution and its associated transaction."""
    try:
        user = User.query.get(user_id)
        if not user:
            logger.warning(f"Contribution failed: User {user_id} not found.")
            return jsonify({"error": "User not found"}), 404

        if not user.group_id:
            logger.warning(f"Contribution failed: User {user_id} is not in any group.")
            return jsonify({"error": "User is not in any group"}), 400

        try:
            amount = float(amount)
            if amount <= 0:
                logger.warning(f"Invalid contribution amount: {amount} by user {user_id}.")
                return jsonify({"error": "Invalid contribution amount"}), 400
        except ValueError:
            logger.warning(f"Invalid contribution amount format: {amount} by user {user_id}.")
            return jsonify({"error": "Amount must be a valid number"}), 400

        contribution = Contribution(
            user_id=user_id,
            group_id=user.group_id,
            amount=amount,
            date=datetime.datetime.now(datetime.timezone.utc),
            status=ContributionStatus.PAID
        )

        transaction = Transaction(
            user_id=user_id,
            group_id=user.group_id,
            amount=amount,
            type=TransactionType.CREDIT,
            reason="Contribution",
            date=datetime.datetime.now(datetime.timezone.utc),
            reference=receipt_number
        )

        user.monthly_total += amount      
        notification = Notification(
            user_id=user_id,
            group_id=user.group_id,
            message=f"Your contribution of ksh {amount} has been received",
            type="Contribution",
            date=datetime.datetime.now(datetime.timezone.utc)
        )
        db.session.add(contribution)
        db.session.add(transaction)
        db.session.add(notification)
        db.session.commit()

        logger.info(f"Contribution logged successfully: User {user_id}, Amount {amount}, Receipt {receipt_number}")
        return {
            "message": "Contribution logged successfully!",
            "contribution_id": contribution.id,
            "transaction_id": transaction.id,
        }, 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Database error while logging contribution for user {user_id}: {str(e)}")
        return {"error": "An unexpected error occurred. Please try again later."}, 500


@contributions_bp.route('/contribute', methods=['POST'])
@jwt_required()
def contribute():
    """Allow a user to log a manual contribution."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        logger.warning(f"Missing request data for contribution by user {user_id}.")
        return jsonify({"error": "Invalid request"}), 400

    amount = data.get('amount')
    receipt_number = data.get('receipt_number')

    if not amount or not receipt_number:
        logger.warning(f"Contribution failed: Missing fields by user {user_id}.")
        return jsonify({"error": "Missing required fields"}), 400

    return log_contribution(user_id, amount, receipt_number)


@contributions_bp.route('/contributions', methods=['GET'])
@jwt_required()
def get_contributions():
    """Retrieve all contributions made by the logged-in user."""
    user_id = get_jwt_identity()
    try:
        user = User.query.get(user_id)

        if not user:
            logger.warning(f"User {user_id} not found while fetching contributions.")
            return jsonify({"error": "User not found"}), 404

        if not user.group_id:
            logger.warning(f"User {user_id} is not in any group while fetching contributions.")
            return jsonify({"error": "User is not in any group"}), 400

        contributions = Contribution.query.filter_by(user_id=user_id, group_id=user.group_id).all()

        return jsonify([{
            "id": contribution.id,
            "amount": contribution.amount,
            "date": contribution.date.strftime("%Y-%m-%d %H:%M:%S"),
            "status": contribution.status.value,
            "group_id": contribution.group_id
        } for contribution in contributions]), 200

    except Exception as e:
        logger.error(f"Error fetching contributions for user {user_id}: {str(e)}")
        return jsonify({"error": "An unexpected error occurred while fetching contributions"}), 500


@contributions_bp.route('/contributions/total', methods=['GET'])
@jwt_required()
def get_total_contributions():
    """Retrieve the total amount contributed by the user's group."""
    user_id = get_jwt_identity()
    try:
        user = User.query.get(user_id)

        if not user:
            logger.warning(f"User {user_id} not found while fetching total contributions.")
            return jsonify({"total_contributions": 0}), 200

        if not user.group_id:
            logger.warning(f"User {user_id} is not in any group while fetching total contributions.")
            return jsonify({"total_contributions": 0}), 200

        total = db.session.query(db.func.sum(Contribution.amount)).filter_by(group_id=user.group_id).scalar() or 0

        return jsonify({"total_contributions": total}), 200

    except Exception as e:
        logger.error(f"Error fetching total contributions for user {user_id}: {str(e)}")
        return jsonify({"error": "An unexpected error occurred while fetching total contributions"}), 500
    
# Contribution streak API
@contributions_bp.route('/contributions/streaks', methods=['GET'])
@jwt_required()
def get_contribution_streaks():
    """Return a ranked list of users in the group based on their contribution streaks (in days)."""
    user_id = get_jwt_identity()
    try:
        user = User.query.get(user_id)

        if not user or not user.group_id:
            return jsonify({"error": "User not found or not in any group"}), 400

        # Get all users in the same group
        group_users = User.query.filter_by(group_id=user.group_id).all()

        streaks = []

        for group_user in group_users:
            contributions = (
                Contribution.query
                .filter_by(user_id=group_user.id, group_id=user.group_id)
                .order_by(Contribution.date.desc())
                .all()
            )

            # Extract only the contribution dates
            contribution_dates = []
            for c in contributions:
                dt = c.date
                if isinstance(dt, datetime.datetime):
                    contribution_dates.append(dt.date())
                elif isinstance(dt, datetime.date):
                    contribution_dates.append(dt)

            # Calculate streak
            streak = 0
            today = datetime.date.today()
            for i in range(len(contribution_dates)):
                expected_date = today - datetime.timedelta(days=streak)
                if expected_date in contribution_dates:
                    streak += 1
                else:
                    break

            streaks.append({
                "name": group_user.name,
                "streak": streak
            })

        # Sort by streak descending
        sorted_streaks = sorted(streaks, key=lambda x: x["streak"], reverse=True)

        return jsonify(sorted_streaks), 200

    except Exception as e:
        logger.error(f"Error generating contribution streaks: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500
