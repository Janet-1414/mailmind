from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ThreadCreate(BaseModel):
    title: Optional[str] = "New thread"


class ThreadExchange(BaseModel):
    id:            str
    email_content: str
    hint:          str
    reply:         str
    tone:          str
    model:         str
    created_at:    datetime

    class Config:
        from_attributes = True


class ThreadResponse(BaseModel):
    id:         str
    title:      str
    created_at: datetime
    updated_at: datetime
    exchanges:  List[ThreadExchange] = []

    class Config:
        from_attributes = True


class ThreadSummary(BaseModel):
    id:         str
    title:      str
    updated_at: datetime
    exchange_count: int = 0

    class Config:
        from_attributes = True
