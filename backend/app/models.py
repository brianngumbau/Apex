from flask_sqlalchemy import SQLAlchemy
import datetime
from enum import Enum
import secrets

db = SQLAlchemy()

class ContributionStatus(Enum):
    MISSING = "Missing"
    PAID = "Paid"

class TransactionType(Enum):
    CREDIT = "credit"
    DEBIT = "debit"
    REPAYMENT = "repayment"

class WithdrawalStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class GroupJoin(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class LoanStatus(Enum):
    DISBURSED = "disbursed"
    REPAID = "repaid"
    PARTIALLY_REPAID = "partially_repaid"

class TransactionReason:
    CONTRIBUTION = "contribution"
    WITHDRAWAL = "withdrawal"
    LOAN_DISBURSEMENT = "loan_disbursement"
    LOAN_REPAYMENT = "loan_repayment"


class InterestFrequency(Enum):
    DAILY = "daily"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(15), unique=True, nullable=False, index=True)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=True)
    monthly_total = db.Column(db.Float, default=0.0)
    profile_photo = db.Column(db.String(255), nullable=True)

class Group(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    daily_contribution_amount = db.Column(db.Float, default=0.0, nullable=False)
    join_code = db.Column(db.String(10), unique=True, nullable=False, default=lambda: secrets.token_hex(3).upper())
    loan_interest_rate = db.Column(db.Float, default=0.0, nullable=False)
    loan_interest_frequency = db.Column(db.Enum(InterestFrequency), default=InterestFrequency.MONTHLY, nullable=False)
    
    admin = db.relationship('User', backref='admin_of_group', foreign_keys=[admin_id])
    members = db.relationship('User', backref='group', lazy=True, cascade="all, delete-orphan", foreign_keys=[User.group_id])

class Contribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=lambda: datetime.datetime.now(datetime.timezone.utc))
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
    group = db.relationship('Group', backref=db.backref('withdrawal_requests', lazy=True, cascade="all, delete-orphan"))


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


class Loan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    outstanding = db.Column(db.Float, nullable=False)
    status = db.Column(db.Enum(LoanStatus), default=LoanStatus.DISBURSED, nullable=False)
    date = db.Column(db.DateTime, default=datetime.datetime.now(datetime.timezone.utc), nullable=False)
    disbursed_transaction_id = db.Column(db.Integer, db.ForeignKey('transaction.id'), nullable=True)

    interest_rate = db.Column(db.Float, nullable=False, default=0.0)
    interest_frequency = db.Column(db.Enum(InterestFrequency), nullable=False, default=InterestFrequency.MONTHLY)

    borrower = db.relationship('User', foreign_keys=[user_id], backref=db.backref('loans_borrowed', lazy=True))
    group = db.relationship('Group', backref=db.backref('loans', lazy=True))

    # Helper method to compute accrued amount
    def calculate_due_amount(self, as_of_date=None):
        if not as_of_date:
            as_of_date = datetime.datetime.now(datetime.timezone.utc)

        elapsed = (as_of_date - self.date).days
        rate = self.interest_rate

        if self.interest_frequency == InterestFrequency.DAILY:
            periods = elapsed
        elif self.interest_frequency == InterestFrequency.MONTHLY:
            periods = elapsed // 30
        elif self.interest_frequency == InterestFrequency.YEARLY:
            periods = elapsed // 365
        else:
            periods = 0

        return round(self.amount * ((1 + rate) ** periods), 2)
    
    def get_outstanding_balance(self, as_of_date=None):
        total_due = self.calculate_due_amount(as_of_date)
        repaid = (self.amount - self.outstanding)
        return max(total_due - repaid, 0.0)

class Announcement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey("group.id"), nullable=False)
    title = db.Column(db.String(100))
    message = db.Column(db.Text, nullable=False)
    date = db.Column(db.DateTime, default=datetime.datetime.now(datetime.timezone.utc))

    group = db.relationship("Group", backref="announcements")
