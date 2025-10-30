from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Notification, User, db
import datetime

notifications_bp = Blueprint("notifications", __name__)

@notifications_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    """ Fetches notifications for the logged-in user. """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)


    if not user or not user.group_id:
        return jsonify({"error": "User not found or not in a group"}), 400

    notifications = Notification.query.filter_by(user_id=user_id, group_id=user.group_id).order_by(Notification.date.desc()).all()
    
    return jsonify([
        {
            "id": notification.id,
            "group_id": user.group_id,
            "message": notification.message,
            "type": notification.type,
            "date": notification.date.isoformat(),
            "is_read": notification.read
        }
        for notification in notifications
    ]), 200

@notifications_bp.route("/notifications/unread", methods=["GET"])
@jwt_required()
def get_unread_notifications():
    """ Fetches unread notifications for the logged-in user. """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.group_id:
        return jsonify({"error": "User not found or not in a group"}), 400

    unread_notifications = Notification.query.filter_by(user_id=user_id, group_id=user.group_id, read=False).order_by(Notification.date.desc()).all()

    return jsonify([
        {
            "id": notification.id,
            "group_id": user.group_id,
            "message": notification.message,
            "type": notification.type,
            "date": notification.date.isoformat(),
            "is_read": notification.read
        }
        for notification in unread_notifications
    ]), 200

@notifications_bp.route("/notifications/read/<int:notification_id>", methods=["POST"])
@jwt_required()
def mark_notification_as_read(notification_id):
    """ Marks a specific notification as read. """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.group_id:
        return jsonify({"error": "User not found or not in a group"}), 400
    
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id, group_id=user.group_id).first()
    
    if not notification:
        return jsonify({"error": "Notification not found"}), 404

    notification.read = True
    db.session.commit()

    return jsonify({"message": "Notification marked as read"}), 200

@notifications_bp.route("/notifications/mark-all-read", methods=["PUT"])
@jwt_required()
def mark_all_notifications_as_read():
    """ Marks all notifications as read for the logged-in user. """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.group_id:
        return jsonify({"error": "User not found or not in a group"}), 400

    Notification.query.filter_by(user_id=user_id, group_id=user.group_id, read=False).update({"read": True})
    db.session.commit()

    return jsonify({"message": "All notifications marked as read"}), 200

@notifications_bp.route("/notifications/<int:notification_id>", methods=["DELETE"])
@jwt_required()
def delete_notification(notification_id):
    """ Deletes a specific notification. """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.group_id:
        return jsonify({"error": "User not found or not in a group"}), 400
    
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id, group_id=user.group_id).first()
    
    if not notification:
        return jsonify({"error": "Notification not found"}), 404

    db.session.delete(notification)
    db.session.commit()

    return jsonify({"message": "Notification deleted successfully"}), 200

@notifications_bp.route("/notifications/clear-all", methods=["DELETE"])
@jwt_required()
def clear_all_notifications():
    """ Deletes all notifications for the logged-in user. """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.group_id:
        return jsonify({"error": "User not found or not in a group"}), 400

    Notification.query.filter_by(user_id=user_id, group_id=user.group_id).delete()
    db.session.commit()

    return jsonify({"message": "All notifications cleared successfully"}), 200

@notifications_bp.route("/notifications/group/<int:group_id>", methods=["GET"])
@jwt_required()
def get_group_notifications(group_id):
    """ Fetches notifications for a specific group (Admin only). """
    user_id = get_jwt_identity()
    
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Unauthorized"}), 403

    notifications = Notification.query.filter_by(group_id=group_id).order_by(Notification.date.desc()).all()

    return jsonify([
        {
            "id": notification.id,
            "message": notification.message,
            "type": notification.type,
            "date": notification.date.isoformat(),
            "read": notification.read
        }
        for notification in notifications
    ]), 200

@notifications_bp.route("/notifications/send", methods=["POST"])
@jwt_required()
def send_notification():
    """ Allows an admin to send a manual notification to a user or group. """
    user_id = get_jwt_identity()
    
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    message = data.get("message")
    notification_type = data.get("type", "General")
    target_user_id = data.get("user_id")

    if not message:
        return jsonify({"error": "Message content is required"}), 400
    
    group_id = user.group_id

    if target_user_id:
        target_user = User.query.filter_by(id=target_user_id, group_id=group_id).first()
        if not target_user:
            return jsonify({"error": "Target user not found or not in your group"}), 404
        
        notification = Notification(
            user_id=target_user.id,
            group_id=group_id,
            message=message,
            type=notification_type,
            date=datetime.datetime.now(datetime.timezone.utc)
        )
        db.session.add(notification)

    else:
        users = User.query.filter_by(group_id=group_id).all()
        for member in users:
            notification = Notification(
                user_id=member.id,
                group_id=group_id,
                message=message,
                type=notification_type,
                date=datetime.datetime.now(datetime.timezone.utc)
            )
            db.session.add(notification)
    db.session.commit()
    
    return jsonify({"message": "Notification sent successfully"}), 200


@notifications_bp.route("/notifications/unread-count", methods=["GET"])
@jwt_required()
def get_unread_count():
    """ Returns the number of unread notifications for the logged-in user. """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.group_id:
        return jsonify({"count": 0}), 200  # safe fallback

    count = Notification.query.filter_by(
        user_id=user_id, group_id=user.group_id, read=False
    ).count()

    return jsonify({"count": count}), 200


@notifications_bp.route("/notifications/<int:notification_id>/mark-read", methods=["PUT"])
@jwt_required()
def mark_single_notification_as_read(notification_id):
    """ Marks a specific notification as read when clicked individually. """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.group_id:
        return jsonify({"error": "User not found or not in a group"}), 400

    notification = Notification.query.filter_by(
        id=notification_id, user_id=user_id, group_id=user.group_id
    ).first()

    if not notification:
        return jsonify({"error": "Notification not found"}), 404

    notification.read = True
    db.session.commit()

    return jsonify({"message": "Notification marked as read"}), 200