import requests
import datetime
import base64
import json
from models import Group, User
from config import Config

from config import Config

MPESA_PASSKEY = Config.MPESA_PASSKEY
MPESA_CONSUMER_KEY = Config.MPESA_CONSUMER_KEY
MPESA_CONSUMER_SECRET = Config.MPESA_CONSUMER_SECRET
MPESA_STK_URL = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"  # Add this if missing
MPESA_B2C_URL = Config.MPESA_B2C_URL
MPESA_CALLBACK_URL = Config.MPESA_CALLBACK_URL
MPESA_B2C_SECURITY_CREDENTIAL = Config.MPESA_B2C_SECURITY_CREDENTIAL
MPESA_B2C_COMMAND_ID = Config.MPESA_B2C_COMMAND_ID
MPESA_B2C_RESULT_URL = Config.MPESA_B2C_RESULT_URL


def get_mpesa_access_token():
    """Fetches the M-Pesa access token for API authentication."""
    url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    response = requests.get(url, auth=(MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET))
    return response.json().get("access_token")

def generate_password(shortcode):
    """Generates the security password required for STK Push."""
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    password_str = f"{shortcode}{MPESA_PASSKEY}{timestamp}"
    password = base64.b64encode(password_str.encode()).decode()
    return password, timestamp

def initiate_stk_push(user_id, amount):
    """Initiates an STK Push for a user based on their group's M-Pesa Paybill number."""
    access_token = get_mpesa_access_token()
    if not access_token:
        return {"error": "Failed to obtain access token"}
    
    # Get user and group details
    user = User.query.get(user_id)
    if not user or not user.group_id:
        return {"error": "User or group not found"}

    group = Group.query.get(user.group_id)
    if not group or not group.mpesa_number:
        return {"error": "Group M-Pesa number not set"}

    # Generate password for STK Push
    password, timestamp = generate_password(group.mpesa_number)

    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    payload = {
        "BusinessShortCode": group.mpesa_number,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": user.phone_number,
        "PartyB": group.mpesa_number, 
        "PhoneNumber": user.phone_number,
        "CallBackURL": MPESA_CALLBACK_URL,
        "AccountReference": f"Contribution-{user.id}-{group.id}",
        "TransactionDesc": "Contribution Payment"
    }

    response = requests.post(MPESA_STK_URL, json=payload, headers=headers)
    response_data = response.json()

    return response_data

def initiate_b2c_payment(user_id, phone_number, amount, reason):
    """
    sends a B2C payment request to safaricom M-PESA API
    """
    access_token = get_mpesa_access_token()
    if not access_token:
        return {"error": "Failed to obtain access token"}
    
    user = User.query.get(user_id)
    if not user or not user.group_id:
        return {"error": "User or group not found"}

    group = Group.query.get(user.group_id)
    if not group or not group.mpesa_number:
        return {"error": "Group M-Pesa number not set"}
    
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    payload = {
        "InitiatorName": "api_initiator",
        "SecurityCredential": MPESA_B2C_SECURITY_CREDENTIAL,
        "CommandID": MPESA_B2C_COMMAND_ID,
        "Amount": amount,
        "PartyA": group.mpesa_number,
        "PartyB": phone_number,
        "Remarks": reason,
        "QueueTimeOutURL": MPESA_B2C_RESULT_URL,
        "ResultURL": MPESA_B2C_RESULT_URL,
        "Occasion": ""
    }
    
    response = requests.post(MPESA_B2C_URL, json=payload, headers=headers)
    return response.json()