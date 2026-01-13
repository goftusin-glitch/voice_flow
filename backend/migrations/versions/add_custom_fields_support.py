"""Add custom fields support to report_field_values

Revision ID: a1b2c3d4e5f6
Revises: f5fc3e085ac4
Create Date: 2025-01-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f5fc3e085ac4'
branch_labels = None
depends_on = None


def upgrade():
    # Add custom_field_name column
    with op.batch_alter_table('report_field_values', schema=None) as batch_op:
        batch_op.add_column(sa.Column('custom_field_name', sa.String(length=255), nullable=True))
        # Make field_id nullable to support custom fields
        batch_op.alter_column('field_id',
                              existing_type=sa.Integer(),
                              nullable=True)


def downgrade():
    # Remove custom_field_name column and revert field_id to non-nullable
    with op.batch_alter_table('report_field_values', schema=None) as batch_op:
        batch_op.drop_column('custom_field_name')
        batch_op.alter_column('field_id',
                              existing_type=sa.Integer(),
                              nullable=False)
