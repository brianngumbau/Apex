# extensions.py
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_mail import Mail
from app.models import db

jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*")
mail = Mail()