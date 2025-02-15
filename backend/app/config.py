import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """
    Base configuration class with default settings
    """

    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
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
    MPESA_B2C_SECURITY_CREDENTIAL = os.getenv("MPESA_B2C_SECURITY_CREDENTIAL")
    MPESA_B2C_COMMAND_ID = os.getenv("MPESA_B2C_COMMAND_ID")
    MPESA_B2C_RESULT_URL = os.getenv("MPESA_B2C_RESULT_URL")

class TestingConfig(Config):
    """
    Configuration class for the testing environment
    """
    SQLALCHEMY_DATABASE_URI = os.getenv("TEST_DATABASE_URL")


# FUNCTION TO LOAD THE APPROPRIATE CONFIGURATION BASED ON FLASK_ENV
def get_config():
    env = os.getenv("FLASK_ENV", "production")
    if env == "testing":
        return TestingConfig()
    return Config()
