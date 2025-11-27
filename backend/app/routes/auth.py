from flask import Blueprint, request, jsonify, send_from_directory, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta
from app.models import db, User, TokenBlacklist, Group
from app.utils.jwt_handler import decode_jwt
from app.utils.helpers import format_phone_number, generate_token, confirm_token, send_email
import os
import uuid
import re
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from app.utils.helpers import get_or_create_google_user

auth_bp = Blueprint("auth", __name__)


# Config for uploads
UPLOAD_FOLDER = os.path.join("uploads", "profile_photos")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# Register
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    required_fields = ["name", "email", "phone", "password"]
    if not data or not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # Validate email format
    if not re.match(EMAIL_REGEX, data["email"]):
        return jsonify({"error": "Invalid email format"}), 400

    formatted_phone = format_phone_number(data["phone"])
    if not formatted_phone:
        return jsonify({"error": "Invalid phone number format. Use 254xxxxxxxxx"}), 400

    if User.query.filter((User.email == data["email"]) | (User.phone == formatted_phone)).first():
        return jsonify({"error": "User with email or phone already exists"}), 409

    hashed_password = generate_password_hash(data["password"])
    new_user = User(
        name=data["name"],
        email=data["email"],
        phone=formatted_phone,
        password=hashed_password,
        is_admin=False,
        group_id=None,
        is_verified=False  # new field
    )
    db.session.add(new_user)
    db.session.commit()

    # Generate email verification token
    token = generate_token(new_user.email)
    verification_url = url_for("auth.verify_email", token=token, _external=True)
    html_body = f"""
    <p>Hi {new_user.name},</p>
    <p>Thanks for registering! Please verify your email by clicking the link below:</p>
    <p><a href="{verification_url}">Verify Email</a></p>
    <p>This link expires in 1 hour.</p>
    """
    send_email("Verify Your Email", new_user.email, html_body)

    return jsonify({"message": "User registered successfully. Please check your email to verify your account."}), 201


# Verify email
@auth_bp.route("/verify/<token>", methods=["GET"])
def verify_email(token):
    email = confirm_token(token)
    if not email:
        return jsonify({"error": "Invalid or expired token"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.is_verified:
        return jsonify({"message": "Email already verified"}), 200

    user.is_verified = True
    db.session.commit()
    return jsonify({"message": "Email verified successfully!"}), 200

# Login
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data or not all(field in data for field in ["email", "password"]):
            return jsonify({"error": "Missing required fields"}), 400

        user = User.query.filter_by(email=data["email"]).first()
        if not user or not check_password_hash(user.password, data["password"]):
            return jsonify({"error": "Invalid credentials"}), 401

        if not user.is_verified:
            return jsonify({"error": "Please verify your email before logging in."}), 403

        access_token = create_access_token(identity=user.id, additional_claims={"sub": str(user.id)})

        group_name = None
        if user.group_id:
            group = Group.query.get(user.group_id)
            if group:
                group_name = group.name

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
                "profile_photo": profile_photo_url,
                "is_verified": user.is_verified
            }
        }

        if not user.group_id:
            response["message"] = "Please create or join a group to continue."

        return jsonify(response), 200

    except Exception as e:
        print("Error in /login:", e)
        return jsonify({"error": "Internal server error"}), 500
    

# Google Login/Register
@auth_bp.route("/auth/google", methods=["POST"])
def google_login():
    try:
        data = request.get_json()
        token = data.get("id_token")

        if not token:
            return jsonify({"error": "Missing Google ID token"}), 400

        # Verify token
        idinfo = id_token.verify_oauth2_token(
            token,
            grequests.Request(),
            os.getenv("GOOGLE_CLIENT_ID")
        )

        # Extract user info
        google_id = idinfo.get("sub")
        name = idinfo.get("name")
        email = idinfo.get("email")
        avatar_url = idinfo.get("picture")

        if not email or not google_id:
            return jsonify({"error": "Invalid Google token"}), 400

        # Create or get user
        user = get_or_create_google_user(
            google_id=google_id,
            name=name,
            email=email,
            avatar_url=avatar_url
        )

        # Create JWT for app session
        access_token = create_access_token(identity=user.id, additional_claims={"sub": str(user.id)})

        group_name = None
        if user.group_id:
            group = Group.query.get(user.group_id)
            if group:
                group_name = group.name

        profile_photo_url = None
        if user.avatar_url:
            profile_photo_url = user.avatar_url
        elif user.profile_photo:
            profile_photo_url = url_for("auth.get_profile_photo", filename=user.profile_photo, _external=True)

        return jsonify({
            "message": "Google login successful",
            "access_token": access_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "avatar_url": profile_photo_url,
                "is_admin": user.is_admin,
                "group_id": user.group_id,
                "group_name": group_name,
                "monthly_total": user.monthly_total,
                "is_verified": user.is_verified
            }
        }), 200

    except ValueError as e:
        return jsonify({"error": f"Invalid token: {e}"}), 400
    except Exception as e:
        print("Error in /auth/google:", e)
        return jsonify({"error": "Internal server error"}), 500



# Logout
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


# Request Password Reset
@auth_bp.route("/request-reset", methods=["POST"])
def request_password_reset():
    data = request.get_json()
    email = data.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    token = generate_token(user.email)
    reset_url = url_for("auth.reset_password", token=token, _external=True)
    html_body = f"""
    <p>Hi {user.name},</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="{reset_url}">Reset Password</a></p>
    <p>This link expires in 1 hour.</p>
    """
    send_email("Password Reset Request", user.email, html_body)
    return jsonify({"message": "Password reset email sent"}), 200


# Reset Password
@auth_bp.route("/reset-password/<token>", methods=["POST"])
def reset_password(token):
    email = confirm_token(token)
    if not email:
        return jsonify({"error": "Invalid or expired token"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    new_password = data.get("new_password")
    if not new_password:
        return jsonify({"error": "New password is required"}), 400

    user.password = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"message": "Password reset successfully"}), 200


# Get Profile
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


# Update Profile
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


# Upload Profile Photo
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


# Change Password
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


# Delete Account
@auth_bp.route("/user/delete", methods=["DELETE"])
@jwt_required()
def delete_account():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        # Check group dependencies
        if user.group_id:
            group = Group.query.get(user.group_id)
            
            # If user is the ADMIN of the group
            if group and group.admin_id == user.id:
                # Count how many members are in this group
                member_count = User.query.filter_by(group_id=group.id).count()
                
                if member_count > 1:
                    return jsonify({
                        "error": "Action denied. You are the group admin. You cannot delete your account while other members are still in the group."
                    }), 403
                
                # If admin is the only member left, delete the group first
                db.session.delete(group)

        # Proceed to delete the user
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"message": "Account deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete account", "details": str(e)}), 500