from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.feedback.models import Feedback
from app.memory.models import EmailLog
from app.cache.service import cache_service


class FeedbackService:
    """Stores user feedback and invalidates cache on thumbs down."""

    def submit(
        self,
        db: Session,
        user_id: str,
        email_log_id: str,
        rating: int,
        comment: str = None,
    ) -> Feedback:
        if rating not in (1, -1):
            raise HTTPException(status_code=400, detail="Rating must be 1 or -1.")

        fb = Feedback(
            user_id=user_id,
            email_log_id=email_log_id,
            rating=rating,
            comment=comment,
        )
        db.add(fb)
        db.commit()
        db.refresh(fb)

        # On thumbs down — invalidate the cache so next request regenerates fresh
        if rating == -1:
            log = db.query(EmailLog).filter(EmailLog.id == email_log_id).first()
            if log:
                cache_service.invalidate(
                    email_content=log.email_content,
                    tone=log.tone,
                    model=log.model,
                    hint=log.hint or "",
                )

        return fb


# Singleton
feedback_service = FeedbackService()
