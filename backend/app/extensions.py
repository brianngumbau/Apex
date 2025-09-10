# extensions.py
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from models import db

jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*")