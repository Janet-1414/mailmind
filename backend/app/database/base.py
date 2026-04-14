"""
database/base.py — SQLAlchemy declarative base and async session factory.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass
