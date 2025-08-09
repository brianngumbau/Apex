from flask import Flask
from flask_jwt_extended import JWTManager
from config import get_config
from flask_migrate import Migrate
from models import db
from routes.auth import auth_bp
from routes.contributions import contributions_bp
from routes.transactions import transactions_bp
from routes.withdrawals import withdrawal_bp
from routes.mpesa_api import mpesa_bp
from routes.groups import groups_bp
from routes.notifications import notifications_bp
from routes.loans import loan_bp
from flask_cors import CORS

jwt = JWTManager()
app = Flask(__name__)
CORS(app)

app.config.from_object(get_config())
db.init_app(app)
jwt.init_app(app)

app.register_blueprint(auth_bp)
app.register_blueprint(contributions_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(withdrawal_bp)
app.register_blueprint(mpesa_bp)
app.register_blueprint(groups_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(loan_bp)


migrate = Migrate(app, db)

@app.route("/")
def home():
    return "Flask is working!"


if __name__ == "__main__":
    app.run(debug=True)