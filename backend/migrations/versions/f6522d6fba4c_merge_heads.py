"""merge heads

Revision ID: f6522d6fba4c
Revises: add_shared_with_team, 5896bf3791b8
Create Date: 2026-01-15 18:52:50.343598

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f6522d6fba4c'
down_revision = ('add_shared_with_team', '5896bf3791b8')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
