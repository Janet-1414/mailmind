"""
SQLAlchemy ORM models for MailMind memory and email log tables.
EmailLog stores every generated reply linked to a thread and user.
MemoryLog tracks every interaction stored in Pinecone for listing,
deletion, and pruning from the UI and memory service.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class EmailLog(Base):
    __tablename__ = "email_logs"

    id                = Column(String, primary_key=True, default=_uuid)
    user_id           = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    thread_id         = Column(String, ForeignKey("threads.id", ondelete="SET NULL"), nullable=True)
    email_content     = Column(Text,   nullable=False)
    hint              = Column(String, nullable=True,  default="")
    reply             = Column(Text,   nullable=False)
    tone              = Column(String, nullable=False)
    model             = Column(String, nullable=False)
    prompt_tokens     = Column(Integer, nullable=False, default=0)
    completion_tokens = Column(Integer, nullable=False, default=0)
    total_tokens      = Column(Integer, nullable=False, default=0)
    cost_usd          = Column(Float,   nullable=False, default=0.0)
    cached            = Column(Boolean, nullable=False, default=False)
    confidence_score  = Column(Float,   nullable=True)
    created_at        = Column(DateTime(timezone=True), default=_now, nullable=False)

    # Relationships — must match back_populates on User, Thread, and Feedback
    user      = relationship("User",     back_populates="email_logs")
    thread    = relationship("Thread",   back_populates="email_logs")
    feedbacks = relationship("Feedback", back_populates="email_log", cascade="all, delete")


class MemoryLog(Base):
    __tablename__ = "memory_logs"

    id          = Column(String, primary_key=True, default=_uuid)
    user_id     = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    pinecone_id = Column(String, nullable=False)
    content     = Column(Text,   nullable=False)
    created_at  = Column(DateTime(timezone=True), default=_now, nullable=False)