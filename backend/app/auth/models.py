"""
auth/models.py — User ORM model.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class User(Base):
    """Represents an application user."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # OAuth tokens (encrypted at rest in production)
    gmail_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    outlook_token: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    threads: Mapped[list["Thread"]] = relationship(  # noqa: F821
        "Thread", back_populates="user", cascade="all, delete-orphan"
    )
    memories: Mapped[list["MemoryLog"]] = relationship(  # noqa: F821
        "MemoryLog", back_populates="user", cascade="all, delete-orphan"
    )
    templates: Mapped[list["EmailTemplate"]] = relationship(  # noqa: F821
        "EmailTemplate", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
