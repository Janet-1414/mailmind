"""
Pydantic schemas for the threads endpoints.
Defines ThreadCreate, ThreadExchange (a single email/reply pair with
confidence score), ThreadResponse (full thread with all exchanges),
and ThreadSummary (lightweight listing with exchange count).
All Pydantic v2 compatible using ConfigDict.
"""
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


class ThreadCreate(BaseModel):
    title: Optional[str] = "New thread"


class ThreadExchange(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:               str
    email_content:    str
    hint:             str
    reply:            str
    tone:             str
    model:            str
    created_at:       datetime
    confidence_score: Optional[float] = None


class ThreadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:         str
    title:      str
    created_at: datetime
    updated_at: datetime
    exchanges:  List[ThreadExchange] = []


class ThreadSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:             str
    title:          str
    updated_at:     datetime
    exchange_count: int = 0
