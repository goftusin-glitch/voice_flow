"""Add shared_with_team column to report_templates

Revision ID: add_shared_with_team
Revises: add_unified_dashboard
Create Date: 2026-01-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'add_shared_with_team'
down_revision = 'add_unified_dashboard'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    # Add shared_with_team column to report_templates (only if it doesn't exist)
    if not column_exists('report_templates', 'shared_with_team'):
        op.add_column('report_templates',
            sa.Column('shared_with_team', sa.Boolean(), nullable=False, server_default='0'))
        # Create index for better query performance
        op.create_index('ix_report_templates_shared_with_team', 'report_templates', ['shared_with_team'])


def downgrade():
    if column_exists('report_templates', 'shared_with_team'):
        op.drop_index('ix_report_templates_shared_with_team', table_name='report_templates')
        op.drop_column('report_templates', 'shared_with_team')
