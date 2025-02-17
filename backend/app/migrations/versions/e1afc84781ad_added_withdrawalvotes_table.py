"""Added withdrawalvotes table

Revision ID: e1afc84781ad
Revises: 2e86c0c9898e
Create Date: 2025-02-05 14:52:18.941035

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e1afc84781ad'
down_revision = '2e86c0c9898e'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('withdrawal_votes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('withdrawal_id', sa.Integer(), nullable=False),
    sa.Column('vote', sa.String(length=10), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.ForeignKeyConstraint(['withdrawal_id'], ['withdrawal_request.transaction_id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('withdrawal_votes')
    # ### end Alembic commands ###
