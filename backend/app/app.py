from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS
from app.config import get_config
from app.models import db
from app.extensions import jwt, socketio, mail  # added mail
import logging, sys

# Import blueprints
from app.routes.auth import auth_bp
from app.routes.contributions import contributions_bp
from app.routes.transactions import transactions_bp
from app.routes.withdrawals import withdrawal_bp
from app.routes.mpesa_api import mpesa_bp
from app.routes.groups import groups_bp
from app.routes.notifications import notifications_bp
from app.routes.loans import loan_bp
from app.routes.admin import admin_bp
from app.routes.user import user_bp

# Logging Setup 
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

# App Factory
app = Flask(__name__)

# Load configuration dynamically based on environment
app.config.from_object(get_config())

# Enable CORS
CORS(
    app,
    resources={r"/*": {
        "origins": ["http://localhost:5173", "https://dapper-sundae-a9aff0.netlify.app/"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
    }},
)

# Initialize Extensions
db.init_app(app)
jwt.init_app(app)
mail.init_app(app)  # ✅ initialize Flask-Mail
socketio.init_app(app, cors_allowed_origins=[
    "http://localhost:5173",
    "https://dapper-sundae-a9aff0.netlify.app/"
])

migrate = Migrate(app, db)

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(contributions_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(withdrawal_bp)
app.register_blueprint(mpesa_bp)
app.register_blueprint(groups_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(loan_bp)
app.register_blueprint(admin_bp, url_prefix="/admin")
app.register_blueprint(user_bp)

# Routes 
@app.route("/")
def home():
    return "Flask is working!"

# Socket.IO 
@socketio.on("join_group")
def handle_join_group(data):
    group_id = data.get("group_id")
    from flask_socketio import join_room
    join_room(f"group_{group_id}")

# Run Server
if __name__ == "__main__":
    import eventlet
    import eventlet.wsgi
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)