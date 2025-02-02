from flask import Flask
from config import get_config
from flask_migrate import Migrate
from models import db
from routes.auth import auth_bp
from routes.contributions import contributions_bp
from routes.transactions import transactions_bp

app = Flask(__name__)
app.config.from_object(get_config())
db.init_app(app)

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(contributions_bp, url_prefix="/contributions")
app.register_blueprint(transactions_bp, url_prefix="/transactions")

migrate = Migrate(app, db)

@app.route("/")
def home():
    return "Flask is working!"


if __name__ == "__main__":
    app.run(debug=True)