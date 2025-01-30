from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, TokenBlacklist, Group
from utils.jwt_handler import create_access_token, decode_jwt
from flask import Blueprint


auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    if not all(field in data for field in ["name", "email", "phone", "password"]):
        return jsonify({"error": "Missing required fields"}), 400
    

    if User.query.filter((User.email == data["email"]) | (User.phone == data["phone"])).first():
        return jsonify({"error": "User with email or phone already exists"}), 409
    
    hashed_password = generate_password_hash(data["password"])

    if data["is_admin"]:
        if "group_name" not in data or "mpesa_number" not in data:
            return jsonify({"error": "Admins must provide a group name and M-pesa number"}), 400
        
        new_group = Group(name=data["group_name"], mpesa_number=data["mpesa_number"])
        db.session.add(new_group)
        db.session.commit()
        group_id = new_group.id
    else:
        group = Group.query.get(data["group_id"])
        if not group:
            return jsonify({"error": "Invalid group ID"}), 400
        group_id = group.id
        

    new_user = User(
        name=data["name"],
        email=data["email"],
        phone=data["phone"],
        password=hashed_password,
        is_admin=data["is_admin"],
        group_id=group_id
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

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
        

        access_token = create_access_token(user.id)
        print("Access token created:", access_token)
        return jsonify({"access_token": access_token}), 200
    
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
