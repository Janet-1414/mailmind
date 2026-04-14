"""
feedback/router.py — feedback submission endpoint.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.router import get_current_user
from app.database.connection import get_db
from app.feedback.models import Feedback
from app.feedback.schemas import FeedbackCreate, FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("/", response_model=FeedbackResponse, status_code=201)
async def submit_feedback(
    data: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> FeedbackResponse:
    fb = Feedback(
        user_id=current_user.id,
        email_log_id=data.email_log_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(fb)
    await db.flush()
    return FeedbackResponse.model_validate(fb)
