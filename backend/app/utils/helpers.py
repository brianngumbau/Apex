import re
import os
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from flask import current_app
from flask_mail import Message
from app.extensions import mail
from markupsafe import Markup
from app.models import User, db

def format_phone_number(phone: str) -> str | None:
    """
    Ensure the phone number is in valid Kenyan format: 2547XXXXXXXX or 2541XXXXXXXX
    Returns formatted phone number (254XXXXXXXXX) or None if invalid.
    """
    if not phone:
        return None

    phone = phone.strip().replace(" ", "").lstrip("+")
    if phone.startswith("0") and len(phone) == 10:
        phone = "254" + phone[1:]
    elif not phone.startswith("254"):
        phone = f"254{phone[-9:]}"

    if re.fullmatch(r"254(7\d{8}|1\d{8})", phone):
        return phone
    return None


# TOKEN HELPERS

def generate_token(email: str, expires_sec: int = 3600) -> str:
    """
    Generates a timed token for the given email.
    Default expiry is 1 hour.
    """
    serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    return serializer.dumps(email, salt=current_app.config["JWT_SECRET_KEY"])


def confirm_token(token: str, expiration: int = 3600) -> str | None:
    """
    Verifies a token and returns the email if valid.
    Returns None if token is invalid or expired.
    """
    serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    try:
        email = serializer.loads(
            token,
            salt=current_app.config["JWT_SECRET_KEY"],
            max_age=expiration,
        )
    except (SignatureExpired, BadSignature):
        return None
    return email


# Email HELper
def send_email(subject: str, recipient: str, html_body: str, sender: str | None = None) -> bool:
    """
    Sends a styled email with both HTML and plain-text parts.
    Adds proper headers to improve Gmail deliverability.
    """
    try:
        mail = current_app.extensions.get("mail")
        if not mail:
            current_app.logger.error("Mail extension not initialized.")
            return False

        sender_email = sender or current_app.config.get("MAIL_USERNAME")
        from_name = current_app.config.get("APP_NAME", "Maziwa")  # or your project name
        msg = Message(
            subject=subject,
            recipients=[recipient],
            sender=(from_name, sender_email),
            reply_to=sender_email,
        )

        # Plain text fallback
        plain_body = Markup(html_body).striptags()
        msg.body = plain_body
        msg.html = html_body

        # Optional headers (help Gmail trust your email more)
        msg.extra_headers = {
            "X-Priority": "3",
            "X-Mailer": "Flask-Mail",
            "Content-Type": "text/html; charset=UTF-8"
        }

        mail.send(msg)
        current_app.logger.info(f"✅ Email sent successfully to {recipient}")
        return True

    except Exception as e:
        current_app.logger.error(f"❌ Error sending email to {recipient}: {e}")
        return False
    


def get_or_create_google_user(google_id: str, name: str, email: str, avatar_url: str | None = None) -> User:
    """
    Find an existing Google user by google_id or email.
    If not found, create a new one.
    """
    user = User.query.filter(
        (User.google_id == google_id) | (User.email == email)
    ).first()

    if user:
        # Update any missing info
        if not user.google_id:
            user.google_id = google_id
        if avatar_url and user.avatar_url != avatar_url:
            user.avatar_url = avatar_url
        db.session.commit()
        return user

    # Create new Google user
    new_user = User(
        name=name,
        email=email,
        google_id=google_id,
        avatar_url=avatar_url,
        is_verified=True  # Google users are automatically verified
    )
    db.session.add(new_user)
    db.session.commit()
    return new_user