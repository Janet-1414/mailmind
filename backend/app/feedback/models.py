import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Feedback(Base):
    __tablename__ = "feedback"

    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id      = Column(String, ForeignKey("users.id"),      nullable=False)
    email_log_id = Column(String, ForeignKey("email_logs.id"), nullable=False)
    rating       = Column(Integer, nullable=False)   # 1 or -1
    comment      = Column(Text, nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    user       = relationship("User",     back_populates="feedbacks")
    email_log  = relationship("EmailLog", back_populates="feedbacks")
