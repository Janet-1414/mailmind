from pydantic import BaseModel
from typing import Optional


class MemoryItemResponse(BaseModel):
    id: str
    content: str
    created_at: str
    metadata: dict


class ClearResponse(BaseModel):
    success: bool
    deleted: int
