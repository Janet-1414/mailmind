"""
memory/schemas.py — Pydantic schemas for memory operations.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class MemoryCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class MemoryResponse(BaseModel):
    id: uuid.UUID
    pinecone_id: str
    content: str
    relevance_score: float
    created_at: datetime
    last_accessed: datetime

    model_config = {"from_attributes": True}


class MemoryHealthResponse(BaseModel):
    total_memories: int
    healthy: int
    pruned_eligible: int
    average_score: float
    health_percentage: float
