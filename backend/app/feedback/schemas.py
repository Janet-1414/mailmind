from typing import Optional
from pydantic import BaseModel


class FeedbackRequest(BaseModel):
    email_log_id: str
    rating: int        # must be 1 or -1
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    success: bool
