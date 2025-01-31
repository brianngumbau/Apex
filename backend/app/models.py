from flask_sqlalchemy import SQLAlchemy
import datetime
from enum import Enum

db = SQLAlchemy()

class ContributionStatus(Enum):
    MISSING = "Missing"
    PAID = "Paid"

class TransactionType(Enum):
    CREDIT = "credit"
    DEBIT = "debit"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(15), unique=True, nullable=False, index=True)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=True)

class Group(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    mpesa_number = db.Column(db.String(15), unique=True, nullable=False, index=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    admin = db.relationship('User', backref='admin_of_group', foreign_keys=[admin_id])
    members = db.relationship('User', backref='group', lazy=True, cascade="all, delete-orphan")

class Contribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.date.today)
    status = db.Column(db.Enum(ContributionStatus), default=ContributionStatus.MISSING, nullable=False)

    user = db.relationship('User', backref=db.backref('contributions', lazy=True, cascade="all, delete-orphan"))

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.Enum(TransactionType), default=TransactionType.CREDIT, nullable=False)
    reason = db.Column(db.String(200), nullable=False)
    date = db.Column(db.DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    user = db.relationship('User', backref=db.backref('transactions', lazy=True, cascade="all, delete-orphan"))

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    read = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref=db.backref('notifications', lazy=True, cascade="all, delete-orphan"))

class TokenBlacklist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(500), nullable=False, unique=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    user = db.relationship('User', backref=db.backref('blacklisted_tokens', lazy=True))