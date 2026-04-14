"""
feedback/schemas.py
"""
import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    email_log_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(None, max_length=1000)


class FeedbackResponse(BaseModel):
    id: uuid.UUID
    email_log_id: uuid.UUID
    rating: int
    comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
