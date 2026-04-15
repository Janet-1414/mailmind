import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id             = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name           = Column(String, nullable=False)
    email          = Column(String, unique=True, nullable=False, index=True)
    hashed_password= Column(String, nullable=False)
    created_at     = Column(DateTime, default=datetime.utcnow)

    email_logs = relationship("EmailLog", back_populates="user", cascade="all, delete")
    feedbacks  = relationship("Feedback", back_populates="user", cascade="all, delete")
    threads    = relationship("Thread",   back_populates="user", cascade="all, delete")
