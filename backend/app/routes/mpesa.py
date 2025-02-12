import os
import base64
import requests
import datetime
from flask import Blueprint, request, jsonify
from requests.auth import HTTPBasicAuth
from flask_jwt_extended import jwt_required, get_jwt_identity
from dotenv import load_dotenv
from models import User
from routes.contributions import contribute

mpesa_bp = Blueprint("mpesa", __name__)

load_dotenv()

# Load M-Pesa credentials from .env
CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")
SHORTCODE = os.getenv("MPESA_SHORTCODE")
PASSKEY = os.getenv("MPESA_PASSKEY")
CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL")

available_token = None
token_expiry = None

# Get access token
def get_access_token():
    global available_token, token_expiry

    if available_token and token_expiry and datetime.datetime.now() < token_expiry:
        return available_token
    
    url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    try:
        response = requests.get(url, auth=HTTPBasicAuth(CONSUMER_KEY, CONSUMER_SECRET))
        response.raise_for_status()

        
        data = response.json()
        available_token = data["access_token"]
        token_expiry = datetime.datetime.now() + datetime.timedelta(seconds=int(data["expires_in"]) - 10)

        if not available_token:
            raise ValueError("Missing access token in response")
        return available_token
    
    except (requests.exceptions.RequestException, ValueError) as e:
        print("Error fetching M-pesa token:", str(e))
        return None

# STK Push route
@mpesa_bp.route("/mpesa/stkpush", methods=["POST"])
@jwt_required()  # Ensure only authenticated users can initiate STK Push
def stk_push():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.phone:
        return jsonify({"error": "Phone number not linked to your account"}), 400
    
    data = request.get_json()
    phone_number = user.phone
    amount = data.get("amount")

    if not amount or amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400

    if not phone_number.startswith("254") or len(phone_number) != 12:
        return jsonify({"error": "Invalid phone number format"}), 400
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    password_str= f"{SHORTCODE}{PASSKEY}{timestamp}"
    password = base64.b64encode(password_str.encode()).decode()

    headers = {"Authorization": f"Bearer {get_access_token()}", "Content-Type": "application/json"}

    try:

        response = requests.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", json={
            "BusinessShortCode": SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone_number,
            "PartyB": SHORTCODE,
            "PhoneNumber": phone_number,
            "CallBackURL": CALLBACK_URL,
            "AccountReference": "ChamaHub",
            "TransactionDesc": "Contribution Payment"
        }, headers=headers)
        response.raise_for_status()
        return jsonify(response.json())
    
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Failed to process STK push", "details": str(e)}), 500
    

# Handle M-Pesa callback
@mpesa_bp.route("/mpesa/callback", methods=["POST"])
def mpesa_callback():
    response = request.get_json()
    print("M-Pesa Callback Response:", response)# Log response for debugging

    try:
        body = response["Body"]["stkCallback"]
        result_code = body["ResultCode"]

        if result_code != 0:
            return jsonify({"error": "Payment failed", "ResultCode": result_code}), 400
        
        amount = body["CallbackMetadata"]["Item"][0]["Value"]
        phone_number = str(body["CallbackMetadata"]["Item"][4]["Value"])
        receipt_number = body["CallbackMetadata"]["Item"][1]["Value"]

        user = User.query.filter_by(phone=phone_number).first()
        if not user:
            return jsonify({"error": "User not found for this phone number"}), 404
        
        contribute(user.id, amount, receipt_number)

        return jsonify({"message": "M-Pesa payment processed successfully!"}), 201
    
    except KeyError as e:
        return jsonify({"error": "Invalid callback format", "details": str(e)}), 400