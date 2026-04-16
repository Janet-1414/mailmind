"""
Pydantic schemas for the memory endpoints.
Defines MemoryItem (a single stored memory with id, content, and
timestamp) and the list/delete response shapes returned by the
memory router.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class MemoryItem(BaseModel):
    id:         str
    content:    str
    created_at: datetime

    class Config:
        from_attributes = True


class ClearResponse(BaseModel):
    success: bool
    deleted: int
