"""Add unified dashboard columns to call_analyses

Revision ID: add_unified_dashboard
Revises: add_custom_fields_support
Create Date: 2026-01-14

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_unified_dashboard'
down_revision = 'add_custom_fields_support'
branch_labels = None
depends_on = None


def upgrade():
    # Add input_type column with ENUM
    op.add_column('call_analyses',
        sa.Column('input_type', sa.Enum('audio', 'text', 'image', name='input_type_enum'),
                  nullable=False, server_default='audio'))

    # Add input_text column for direct text input
    op.add_column('call_analyses',
        sa.Column('input_text', sa.Text(), nullable=True))

    # Add image_file_path column for image input
    op.add_column('call_analyses',
        sa.Column('image_file_path', sa.String(length=500), nullable=True))


def downgrade():
    op.drop_column('call_analyses', 'image_file_path')
    op.drop_column('call_analyses', 'input_text')
    op.drop_column('call_analyses', 'input_type')

    # Drop the enum type
    op.execute('DROP TYPE IF EXISTS input_type_enum')
