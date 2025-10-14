# app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """
    Base configuration class with default settings
    """
    # Database / JWT
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "change-this-secret"))
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # M-Pesa API Credentials
    MPESA_CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY")
    MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")
    MPESA_SHORTCODE = os.getenv("MPESA_SHORTCODE")
    MPESA_PASSKEY = os.getenv("MPESA_PASSKEY")
    MPESA_CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL")

    MPESA_B2C_URL = os.getenv("MPESA_B2C_URL")
    MPESA_B2C_INITIATOR_NAME = os.getenv("MPESA_B2C_INITIATOR_NAME")
    MPESA_ORIGINATOR_CONVERSATION_ID = os.getenv("MPESA_ORIGINATOR_CONVERSATION_ID")
    MPESA_B2C_SECURITY_CREDENTIAL = os.getenv("MPESA_B2C_SECURITY_CREDENTIAL")
    MPESA_B2C_COMMAND_ID = os.getenv("MPESA_B2C_COMMAND_ID")
    MPESA_B2C_TIMEOUT_URL = os.getenv("MPESA_B2C_TIMEOUT_URL")
    MPESA_B2C_RESULT_URL = os.getenv("MPESA_B2C_RESULT_URL")

    #  Email (Flask-Mail)
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    # support both TLS and SSL via env flags
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True").lower() in ("true", "1", "yes")
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "False").lower() in ("true", "1", "yes")
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = (
        os.getenv("MAIL_NAME", "Maziwa"),
        os.getenv("MAIL_USERNAME")
    )
    # Useful in testing to avoid actually sending emails
    MAIL_SUPPRESS_SEND = os.getenv("MAIL_SUPPRESS_SEND", "False").lower() in ("true", "1", "yes")

    # Frontend URL 
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Admin / contact email (receives contact form etc.)
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "maziwa470@gmail.com")

    # Token expiration defaults (seconds) can be tweaked
    EMAIL_CONFIRMATION_EXPIRATION = int(os.getenv("EMAIL_CONFIRMATION_EXPIRATION", 3600))  # 1 hour
    PASSWORD_RESET_EXPIRATION = int(os.getenv("PASSWORD_RESET_EXPIRATION", 3600))  # 1 hour


class TestingConfig(Config):
    """
    Configuration class for the testing environment
    """
    SQLALCHEMY_DATABASE_URI = os.getenv("TEST_DATABASE_URL")
    MAIL_SUPPRESS_SEND = True  # don't send emails during tests


# FUNCTION TO LOAD THE APPROPRIATE CONFIGURATION BASED ON FLASK_ENV
def get_config():
    env = os.getenv("FLASK_ENV", "production")
    if env == "testing":
        return TestingConfig()
    return Config()