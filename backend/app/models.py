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

class WithdrawalStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    FAILED = "failed"

class GroupJoin(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(15), unique=True, nullable=False, index=True)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=True)
    monthly_total = db.Column(db.Float, default=0.0)

class Group(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    admin = db.relationship('User', backref='admin_of_group', foreign_keys=[admin_id])
    members = db.relationship('User', backref='group', lazy=True, cascade="all, delete-orphan", foreign_keys=[User.group_id])

class Contribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.date.today)
    status = db.Column(db.Enum(ContributionStatus), default=ContributionStatus.MISSING, nullable=False)

    user = db.relationship('User', backref=db.backref('contributions', lazy=True, cascade="all, delete-orphan"))
    group = db.relationship('Group', backref=db.backref('contributions', lazy=True, cascade="all, delete-orphan"))

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.Enum(TransactionType), default=TransactionType.CREDIT, nullable=False)
    reason = db.Column(db.String(200), nullable=False)
    date = db.Column(db.DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    reference = db.Column(db.String(50), nullable=True)

    user = db.relationship('User', backref=db.backref('transactions', lazy=True, cascade="all, delete-orphan"))
    group = db.relationship('Group', backref=db.backref('transactions', lazy=True, cascade="all, delete-orphan"))

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey("group.id"), nullable=True)
    message = db.Column(db.String(255), nullable=False)
    read = db.Column(db.Boolean, default=False)
    type = db.Column(db.String(50), nullable=False)
    date = db.Column(db.DateTime, default=datetime.datetime.now(datetime.timezone.utc))

    user = db.relationship('User', backref=db.backref('notifications', lazy=True, cascade="all, delete-orphan"))
    group = db.relationship("Group", backref=db.backref("notifications", lazy=True, cascade="all, delete-orphan"))

class TokenBlacklist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(500), nullable=False, unique=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    user = db.relationship('User', backref=db.backref('blacklisted_tokens', lazy=True))


class WithdrawalRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transaction.id'), nullable=False, unique=True)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    status = db.Column(db.Enum(WithdrawalStatus), default=WithdrawalStatus.PENDING, nullable=False)
    approvals = db.Column(db.Integer, default=0)
    rejections = db.Column(db.Integer, default=0)
    mpesa_transaction_id = db.Column(db.String(50), unique=True, nullable=True)

    transaction = db.relationship('Transaction', backref=db.backref('withdrawal_request', uselist=False, cascade="all, delete-orphan"))
    group = db.relationship('Group', backref=db.backref('withdrawal_request', lazy=True, cascade="all, delete-orphan"))


class WithdrawalVotes(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    withdrawal_id = db.Column(db.Integer, db.ForeignKey("withdrawal_request.id"), nullable=False)
    vote = db.Column(db.String(10), nullable=False)

    user = db.relationship("User", backref="withdrawal_votes")
    withdrawal = db.relationship("WithdrawalRequest", backref="votes")
    group = db.relationship('Group', backref=db.backref('withdrawalvotes', lazy=True, cascade="all, delete-orphan"))


class GroupJoinRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey("group.id"), nullable=False)
    status = db.Column(db.Enum(GroupJoin), default=GroupJoin.PENDING, nullable=False)
    date = db.Column(db.DateTime, default=datetime.datetime.now(datetime.timezone.utc), nullable=False)

    user = db.relationship("User", backref="join_requests")
    group = db.relationship("Group", backref="join_requests")