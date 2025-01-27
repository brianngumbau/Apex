import jwt
import datetime
from flask import current_app


def create_access_token(user_id):
    """
    Generate JWT access token for a user
    """
    payload = {
        "user_id": user_id,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    }

    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")

def verify_access_token(token):
    """
    Verify the JWT token.
    """
    try:
        payload = jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
        return payload["user_id"]
    
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
    

def decode_jwt(token):
    try:
        decoded_token = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

        if token in token_blacklist:
            return None
        
        return decoded_token
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None