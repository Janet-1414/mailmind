"""
Pydantic schemas for the memory endpoints.
Defines MemoryItem (a single stored memory with id, content, and
timestamp) and the list/delete response shapes returned by the
memory router.
"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class MemoryItem(BaseModel):
    id:         str
    content:    str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClearResponse(BaseModel):
    success: bool
    deleted: int
