from flask import Blueprint, request, jsonify, send_from_directory, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
from models import db, User, TokenBlacklist, Group
from utils.jwt_handler import decode_jwt
from utils.helpers import format_phone_number
import os
import uuid

auth_bp = Blueprint("auth", __name__)

# ----------------------------
# Config for uploads
# ----------------------------
UPLOAD_FOLDER = os.path.join("uploads", "profile_photos")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ----------------------------
# Register
# ----------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    required_fields = ["name", "email", "phone", "password"]
    if not data or not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    formatted_phone = format_phone_number(data["phone"])
    if not formatted_phone:
        return jsonify({"error": "Invalid phone number format. Use 2547xxxxxxxx"}), 400

    if User.query.filter((User.email == data["email"]) | (User.phone == formatted_phone)).first():
        return jsonify({"error": "User with email or phone already exists"}), 409

    hashed_password = generate_password_hash(data["password"])
    new_user = User(
        name=data["name"],
        email=data["email"],
        phone=formatted_phone,
        password=hashed_password,
        is_admin=False,
        group_id=None
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully. Please log in and join or create a group."}), 201


# ----------------------------
# Login (returns access_token + user info)
# ----------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data or not all(field in data for field in ["email", "password"]):
            return jsonify({"error": "Missing required fields"}), 400

        user = User.query.filter_by(email=data["email"]).first()
        if not user or not check_password_hash(user.password, data["password"]):
            return jsonify({"error": "Invalid credentials"}), 401

        # Create token (keep any additional_claims if you used them before)
        access_token = create_access_token(identity=user.id, additional_claims={"sub": str(user.id)})

        # fetch group name if exists
        group_name = None
        if user.group_id:
            group = Group.query.get(user.group_id)
            if group:
                group_name = group.name

        # full profile_photo URL if set
        profile_photo_url = None
        if user.profile_photo:
            profile_photo_url = url_for("auth.get_profile_photo", filename=user.profile_photo, _external=True)

        response = {
            "access_token": access_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "is_admin": user.is_admin,
                "group_id": user.group_id,
                "group_name": group_name,
                "monthly_total": user.monthly_total,
                "profile_photo": profile_photo_url
            }
        }

        if not user.group_id:
            response["message"] = "Please create or join a group to continue."

        return jsonify(response), 200

    except Exception as e:
        print("Error in /login:", e)
        return jsonify({"error": "Internal server error"}), 500


# ----------------------------
# Logout (blacklist token)
# ----------------------------
@auth_bp.route("/logout", methods=["POST"])
def logout():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"error": "Token is missing or invalid"}), 401

    token = auth_header.split(" ")[1]
    decoded_token = decode_jwt(token)

    if not decoded_token:
        return jsonify({"error": "Invalid token"}), 401

    blacklisted_token = TokenBlacklist(token=token)
    db.session.add(blacklisted_token)
    db.session.commit()

    return jsonify({"message": "Logged out successfully"}), 200


# ----------------------------
# Get Profile
# ----------------------------
@auth_bp.route("/user/profile", methods=["GET"])
@jwt_required()
def get_user_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    group_name = None
    if user.group_id:
        group = Group.query.get(user.group_id)
        if group:
            group_name = group.name

    profile_photo_url = None
    if user.profile_photo:
        profile_photo_url = url_for("auth.get_profile_photo", filename=user.profile_photo, _external=True)

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "is_admin": user.is_admin,
        "group_id": user.group_id,
        "group_name": group_name,
        "monthly_total": user.monthly_total,
        "profile_photo": profile_photo_url
    }), 200


# ----------------------------
# Update Profile (PUT /user/profile)
# ----------------------------
@auth_bp.route("/user/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    if not data:
        return jsonify({"error": "No input data"}), 400

    if "name" in data:
        current_user.name = data["name"]
    if "email" in data:
        current_user.email = data["email"]
    if "phone" in data:
        formatted_phone = format_phone_number(data["phone"])
        if formatted_phone:
            current_user.phone = formatted_phone

    db.session.commit()

    # reply with updated user basic info and profile_photo URL
    profile_photo_url = None
    if current_user.profile_photo:
        profile_photo_url = url_for("auth.get_profile_photo", filename=current_user.profile_photo, _external=True)

    return jsonify({
        "message": "Profile updated successfully",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "phone": current_user.phone,
            "profile_photo": profile_photo_url
        }
    }), 200


# ----------------------------
# Upload Profile Photo
# ----------------------------
@auth_bp.route("/user/profile/photo", methods=["POST"])
@jwt_required()
def upload_profile_photo():
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    if "photo" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["photo"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        # preserve extension
        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = secure_filename(f"{current_user.id}_{uuid.uuid4().hex}.{ext}")
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        current_user.profile_photo = filename
        db.session.commit()

        profile_photo_url = url_for("auth.get_profile_photo", filename=filename, _external=True)
        return jsonify({"message": "Profile photo uploaded successfully", "profile_photo": profile_photo_url}), 200

    return jsonify({"error": "Invalid file type"}), 400


# Serve profile photos
@auth_bp.route("/user/profile/photo/<filename>", methods=["GET"])
def get_profile_photo(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# ----------------------------
# Change Password
# ----------------------------
@auth_bp.route("/change_password", methods=["PUT"])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        return jsonify({"error": "Both old and new passwords required"}), 400

    if not check_password_hash(current_user.password, old_password):
        return jsonify({"error": "Old password is incorrect"}), 401

    current_user.password = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({"message": "Password changed successfully"}), 200