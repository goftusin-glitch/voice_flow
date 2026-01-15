"""Add unified dashboard columns to call_analyses

Revision ID: add_unified_dashboard
Revises: a1b2c3d4e5f6
Create Date: 2026-01-14

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'add_unified_dashboard'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade():
    # Add input_type column with ENUM (only if it doesn't exist)
    if not column_exists('call_analyses', 'input_type'):
        op.add_column('call_analyses',
            sa.Column('input_type', sa.Enum('audio', 'text', 'image', name='input_type_enum'),
                      nullable=False, server_default='audio'))

    # Add input_text column for direct text input (only if it doesn't exist)
    if not column_exists('call_analyses', 'input_text'):
        op.add_column('call_analyses',
            sa.Column('input_text', sa.Text(), nullable=True))

    # Add image_file_path column for image input (only if it doesn't exist)
    if not column_exists('call_analyses', 'image_file_path'):
        op.add_column('call_analyses',
            sa.Column('image_file_path', sa.String(length=500), nullable=True))


def downgrade():
    if column_exists('call_analyses', 'image_file_path'):
        op.drop_column('call_analyses', 'image_file_path')
    if column_exists('call_analyses', 'input_text'):
        op.drop_column('call_analyses', 'input_text')
    if column_exists('call_analyses', 'input_type'):
        op.drop_column('call_analyses', 'input_type')

    # Drop the enum type
    op.execute('DROP TYPE IF EXISTS input_type_enum')
