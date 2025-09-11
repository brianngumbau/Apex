from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Group, GroupJoinRequest, GroupJoin, Notification, Announcement
import datetime

groups_bp = Blueprint('group', __name__)

@groups_bp.route("/group/create", methods=["POST"])
@jwt_required()
def create_group():
    """
    Allow users to create a new group
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.group_id:
        return jsonify({"error": "You are already in a group"}), 400
    
    data = request.get_json()
    if "group_name" not in data:
        return jsonify({"error": "Group name is required"}), 400
    
    new_group = Group(name=data["group_name"], admin_id=user.id)
    db.session.add(new_group)
    db.session.commit()

    user.group_id = new_group.id
    user.is_admin = True
    db.session.commit()


    return jsonify({"message": "Group created successfully", "group_id": new_group.id}), 201


@groups_bp.route("/group/join", methods=["POST"])
@jwt_required()
def request_to_join_group():
    """Allows users to request to join an existing group
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.group_id:
        return jsonify({"error": "You are already in a group"}), 400
    
    data = request.get_json()
    if "group_id" not in data:
        return jsonify({"error": "Group ID is required"}), 400
    
    group = Group.query.get(data["group_id"])
    if not group:
        return jsonify({"error": "Invalid group ID"}), 404
    
    existing_request = GroupJoinRequest.query.filter_by(user_id=user_id, group_id=group.id, status=GroupJoin.PENDING).first()
    if existing_request:
        return jsonify({"error": "You already have a pending join request", "join_request_id": existing_request.id}), 400
    
    join_request = GroupJoinRequest(
        user_id=user_id,
        group_id=group.id,
        status=GroupJoin.PENDING,
        date=datetime.datetime.now(datetime.timezone.utc)
    )
    db.session.add(join_request)
    db.session.commit()

    notification = Notification(
        user_id=group.admin_id,
        group_id=group.id,
        message=f"{user.name} has requested to join the group.",
        type="Join request",
        date=datetime.datetime.now(datetime.timezone.utc)
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({"message": "Join request sent. Awaiting admin approval", "join_request_id": join_request.id}), 200

@groups_bp.route("/group/join/approve/<int:request_id>", methods=["POST"])
@jwt_required()
def approve_join_request(request_id):
    """Allows an admin to approve a  join request
    """
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)

    if not admin or not admin.is_admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    join_request = GroupJoinRequest.query.get(request_id)
    if not join_request or join_request.status != GroupJoin.PENDING:
        return jsonify({"error": "Join request not found or already processed"}), 404
    
    group = Group.query.get(join_request.group_id)
    
    join_request.status = GroupJoin.APPROVED
    db.session.commit()

    user = User.query.get(join_request.user_id)
    user.group_id = join_request.group_id
    db.session.commit()

    notification = Notification(
        user_id=user.id,
        group_id=group.id,
        message=f"Your request to join {group.name} has been approved.",
        type=" Join Approval",
        date=datetime.datetime.now(datetime.timezone.utc)
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({"message": f"{user.name} has been added to the group"}), 200


@groups_bp.route("/group/join/reject/<int:request_id>", methods=["POST"])
@jwt_required()
def reject_join_request(request_id):
    """Allows an admin to reject a  join request
    """
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)

    if not admin or not admin.is_admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    join_request = GroupJoinRequest.query.get(request_id)
    if not join_request or join_request.status != GroupJoin.PENDING:
        return jsonify({"error": "Join request not found or already processed"}), 404
    
    group = Group.query.get(join_request.group_id)
    
    join_request.status = GroupJoin.REJECTED
    db.session.commit()

    notification = Notification(
        user_id=join_request.user_id,
        group_id=group.id,
        message=f"Your request to join {group.name} has been rejected.",
        type=" Join Rejection",
        date=datetime.datetime.now(datetime.timezone.utc)
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({"message": "Join request rejected"}), 200

@groups_bp.route("/group/leave", methods=["POST"])
@jwt_required()
def leave_group():
    """Allows a user to leave the group
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user.group_id:
        return jsonify({"error": "You are not in a group"}), 400
    
    group = Group.query.get(user.group_id)

    if user.is_admin:
        return jsonify({"error": "Admins cannot leave the group directly. Assign a new admin first"}), 400
    
    user.group_id = None
    db.session.commit()

    notification = Notification(
        user_id=group.admin_id,
        group_id=group.id,
        message=f"{user.name} has left the group",
        type="Member left",
        date=datetime.datetime.now(datetime.timezone.utc)

    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({"message": "You have left the group."}), 200

@groups_bp.route("/group/members", methods=["GET"])
@jwt_required()
def get_group_members():
    """Fetches all members of the logged-in user's group
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user.group_id:
        return jsonify({"error": "You are not in a group"}), 400
    
    members = User.query.filter_by(group_id=user.group_id).all()

    return jsonify([
        {"id": member.id,
         "name": member.name,
         "is_admin": member.is_admin,
         "group_id": member.group_id
        }
        
        for member in members
    ]), 200


@groups_bp.route("/groups", methods=["GET"])
@jwt_required()
def get_groups():
    """Fetches all existing groups
    """
    groups = Group.query.all()

    return jsonify([
        {"id": group.id,
        "name": group.name}
        for group in groups
    ])



@groups_bp.route("/groups/<int:group_id>/daily_amount", methods=["GET"])
@jwt_required()
def get_daily_amount(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404
    
    return jsonify({
        "group_id": group.id,
        "group_name": group.name,
        "daily_contribution_amount": group.daily_contribution_amount
    }), 200


# ---------------------------
# ANNOUNCEMENTS ENDPOINTS
# ---------------------------
@groups_bp.route("/group/<int:group_id>/announcements", methods=["GET"])
@jwt_required()
def get_announcements(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404

    announcements = (
        Announcement.query.filter_by(group_id=group_id)
        .order_by(Announcement.date.desc())
        .all()
    )
    return jsonify([
        {"id": a.id, "title": a.title, "message": a.message, "created_at": a.date}
        for a in announcements
    ])


@groups_bp.route("/group/<int:group_id>/announcements", methods=["POST"])
@jwt_required()
def create_announcement(group_id):
    current_user_id = get_jwt_identity()
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404

    # ✅ Check user and admin status
    user = User.query.get(current_user_id)
    if not user or user.group_id != group_id or not user.is_admin:
        return jsonify({"error": "Only admins of this group can post announcements"}), 403

    data = request.get_json()
    title = data.get("title")
    message = data.get("message")
    if not message:
        return jsonify({"error": "Message is required"}), 400

    announcement = Announcement(group_id=group_id, title=title, message=message)
    db.session.add(announcement)
    db.session.commit()

    return jsonify({"message": "Announcement created successfully"}), 201


# 
@groups_bp.route("/group/<int:group_id>/announcements/<int:announcement_id>", methods=["DELETE"])
@jwt_required()
def delete_announcement(group_id, announcement_id):
    current_user_id = get_jwt_identity()
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404

    # ✅ Check user and admin status
    user = User.query.get(current_user_id)
    if not user or user.group_id != group_id or not user.is_admin:
        return jsonify({"error": "Only admins of this group can delete announcements"}), 403

    announcement = Announcement.query.filter_by(id=announcement_id, group_id=group_id).first()
    if not announcement:
        return jsonify({"error": "Announcement not found"}), 404

    db.session.delete(announcement)
    db.session.commit()

    return jsonify({"message": "Announcement deleted successfully"}), 200
