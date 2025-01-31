"""Add foreign keys to user and group

Revision ID: 1a4a8845e5f6
Revises: ad6db80dab33
Create Date: 2025-01-31 09:55:51.682371

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1a4a8845e5f6'
down_revision = 'ad6db80dab33'
branch_labels = None
depends_on = None


def upgrade():
    # Add the foreign key constraint (if the column already exists)
    op.create_foreign_key('fk_user_group', 'user', 'group', ['group_id'], ['id'])

def downgrade():
    # Remove the foreign key constraint
    op.drop_constraint('fk_user_group', 'user', type_='foreignkey')
