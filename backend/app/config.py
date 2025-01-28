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


class TestingConfig(Config):
    """
    Configuration class for the testing environment
    """
    SQLALCHEMY_DATABASE_URI = os.getenv("TEST_DATABASE_URL")


#FUNCTION TO LOAD THE APPROPRIATE CONFIGURATION BASED ON FLASK_ENV
def get_config():
    env = os.getenv("FLASK_ENV", "production")
    if env == "testing":
        return TestingConfig()
    return Config()