"""
templates/schemas.py — Pydantic schemas for email templates.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class TemplateCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1, max_length=10000)
    tone: str | None = Field(None, max_length=50)
    tags: str | None = Field(None, max_length=500)


class TemplateUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    content: str | None = Field(None, min_length=1, max_length=10000)
    tone: str | None = Field(None, max_length=50)
    tags: str | None = Field(None, max_length=500)


class TemplateResponse(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    tone: str | None
    tags: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
