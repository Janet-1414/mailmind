"""
threads/schemas.py — Pydantic schemas for threads and email logs.
"""

import uuid
from datetime import datetime

from pydantic import ConfigDict, BaseModel


class ThreadCreate(BaseModel):
    title: str = "New Thread"


class EmailLogResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=(), from_attributes=True)
    id: uuid.UUID
    email_content: str
    reply: str
    model_used: str | None
    tokens_used: int
    confidence_score: int
    created_at: datetime


class ThreadResponse(BaseModel):
    id: uuid.UUID
    title: str
    created_at: datetime
    email_logs: list[EmailLogResponse] = []

    model_config = {"from_attributes": True}
