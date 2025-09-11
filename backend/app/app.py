from flask import Flask
from flask_migrate import Migrate
from flask_cors import CORS
from app.config import get_config
from app.models import db
from extensions import jwt, socketio

# Import blueprints
from routes.auth import auth_bp
from routes.contributions import contributions_bp
from routes.transactions import transactions_bp
from routes.withdrawals import withdrawal_bp
from routes.mpesa_api import mpesa_bp
from routes.groups import groups_bp
from routes.notifications import notifications_bp
from routes.loans import loan_bp
from routes.admin import admin_bp
from routes.user import user_bp

app = Flask(__name__)
CORS(app)
app.config.from_object(get_config())

# Initialize extensions
db.init_app(app)
jwt.init_app(app)
socketio.init_app(app, cors_allowed_origins="*")

# Register blueprints
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

migrate = Migrate(app, db)

@app.route("/")
def home():
    return "Flask is working!"

@socketio.on("join_group")
def handle_join_group(data):
    group_id = data.get("group_id")
    from flask_socketio import join_room
    join_room(f"group_{group_id}")

if __name__ == "__main__":
    import eventlet
    import eventlet.wsgi
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)