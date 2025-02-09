import os
import base64
import requests
import datetime
from flask import Blueprint, request, jsonify
from requests.auth import HTTPBasicAuth
from flask_jwt_extended import jwt_required
from dotenv import load_dotenv

mpesa_bp = Blueprint("mpesa", __name__)

load_dotenv()

# Load M-Pesa credentials from .env
CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")
SHORTCODE = os.getenv("MPESA_SHORTCODE")
PASSKEY = os.getenv("MPESA_PASSKEY")
CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL")

# Get access token
def get_access_token():
    url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    response = requests.get(url, auth=HTTPBasicAuth(CONSUMER_KEY, CONSUMER_SECRET))
    return response.json().get("access_token")

# STK Push route
@mpesa_bp.route("/mpesa/stkpush", methods=["POST"])
@jwt_required()  # Ensure only authenticated users can initiate STK Push
def stk_push():
    data = request.get_json()
    phone_number = data.get("phone_number")
    amount = data.get("amount")
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    password_str= f"{SHORTCODE}{PASSKEY}{timestamp}"
    password = base64.b64encode(password_str.encode()).decode()

    payload = {
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
    }

    headers = {"Authorization": f"Bearer {get_access_token()}", "Content-Type": "application/json"}
    response = requests.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", json=payload, headers=headers)
    return jsonify(response.json())

# Handle M-Pesa callback
@mpesa_bp.route("/mpesa/callback", methods=["POST"])
def mpesa_callback():
    response = request.get_json()
    print("M-Pesa Callback Response:", response)  # Log response for debugging
    return jsonify({"message": "Callback received"})