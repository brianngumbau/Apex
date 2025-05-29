from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, TokenBlacklist, Group
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from utils.jwt_handler import decode_jwt
from utils.helpers import format_phone_number
from flask import Blueprint


auth_bp = Blueprint('auth', __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    required_fields = ["name", "email", "phone", "password"]
    if not all(field in data for field in required_fields):
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

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        print("Request data:", data)

        if not all(field in data for field in ["email", "password"]):
            return jsonify({"error": "Missing required fields"}), 400
        
        user = User.query.filter_by(email=data["email"]).first()
        print("User found:", user)
        if not user or not check_password_hash(user.password, data["password"]):
            return jsonify({"error": "Invalid credentials"}), 401
        

        access_token = create_access_token(identity=user.id, additional_claims={"sub": str(user.id)})
        print("Access token created:", access_token)

        response = {
            "access_token": access_token,
            "user_id": user.id
        }

        if not user.group_id:
            response["message"] = "Please create or join a group to continue."

        return jsonify(response), 200
    
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Internal server error"}), 500

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

@auth_bp.route("/user/profile", methods=["GET"])
@jwt_required()
def get_user_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    group_name = None
    if user.group_id:
        group = Group.query.get(user.group_id)
        if group:
            group_name = group.name

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "is_admin": user.is_admin,
        "group_id": user.group_id,
        "group_name": group_name,
        "monthly_total": user.monthly_total
    }), 200