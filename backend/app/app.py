from flask import Flask
from config import get_config
from flask_migrate import Migrate
from models import db
from routes.auth import auth_bp

app = Flask(__name__)
app.config.from_object(get_config())
db.init_app(app)

app.register_blueprint(auth_bp, url_prefix="/auth")

migrate = Migrate(app, db)

@app.route("/")
def home():
    return "Flask is working!"


if __name__ == "__main__":
    app.run(debug=True)