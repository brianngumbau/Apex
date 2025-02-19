"""Add mpesa_transaction_id to WithdrawalRequest

Revision ID: 1c3b889b4139
Revises: eabe0a228bd6
Create Date: 2025-02-17 13:30:48.698540

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1c3b889b4139'
down_revision = 'eabe0a228bd6'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('withdrawal_request', schema=None) as batch_op:
        batch_op.add_column(sa.Column('mpesa_transaction_id', sa.String(length=50), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('withdrawal_request', schema=None) as batch_op:
        batch_op.drop_column('mpesa_transaction_id')

    # ### end Alembic commands ###
