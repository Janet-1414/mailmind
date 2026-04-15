from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.service import get_current_user
from app.auth.models import User
from app.database.base import get_db
from app.feedback.schemas import FeedbackRequest, FeedbackResponse
from app.feedback.service import feedback_service

router = APIRouter()


@router.post("", response_model=FeedbackResponse)
def submit_feedback(
    req: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    feedback_service.submit(
        db=db,
        user_id=current_user.id,
        email_log_id=req.email_log_id,
        rating=req.rating,
        comment=req.comment,
    )
    return FeedbackResponse(success=True)
