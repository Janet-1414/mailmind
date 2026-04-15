"""Add confidence_score to email_logs

Revision ID: 0002
Revises: 0001
Create Date: 2025-01-02 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # confidence_score already included in 0001 for fresh installs
    # this migration handles existing databases upgrading from Sprint 3
    with op.batch_alter_table("email_logs") as batch_op:
        batch_op.add_column(
            sa.Column("confidence_score", sa.Float(), nullable=True)
        )


def downgrade() -> None:
    with op.batch_alter_table("email_logs") as batch_op:
        batch_op.drop_column("confidence_score")
