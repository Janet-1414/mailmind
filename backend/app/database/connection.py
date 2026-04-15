"""
Database engine and table initialisation for MailMind.
Supports both SQLite (local development) and PostgreSQL (production via Railway).
Connection pooling is configured appropriately for each engine type.
"""
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.database.base import Base

logger = logging.getLogger(__name__)

# ── Engine setup ──────────────────────────────────────────────────────────────
_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if _is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=300,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables() -> None:
    """Create all tables that don't exist yet. Used on startup for SQLite.
    For PostgreSQL in production, Alembic migrations handle schema changes."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables ready.")
    except Exception as exc:
        logger.error("Failed to create tables: %s", exc)
        raise
