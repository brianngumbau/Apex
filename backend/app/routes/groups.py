from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Group

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
def join_group():
    """
    Allows users to join an existing group.
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

    # Assign user to the group (is_admin remains False)
    user.group_id = group.id
    db.session.commit()

    return jsonify({"message": "Joined group successfully"}), 200

