"""
feedback/service.py — Feedback service for storing and retrieving feedback.
"""

import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.feedback.models import Feedback
from app.feedback.schemas import FeedbackCreate
from app.utils.logger import get_logger

logger = get_logger(__name__)


class FeedbackService:
    """Handles feedback storage and retrieval for a specific user."""

    def __init__(self, db: AsyncSession, user_id: uuid.UUID) -> None:
        self._db = db
        self._user_id = user_id

    async def create(self, data: FeedbackCreate) -> Feedback:
        """Store a new feedback entry."""
        feedback = Feedback(
            user_id=self._user_id,
            email_log_id=data.email_log_id,
            rating=data.rating,
            comment=data.comment,
        )
        self._db.add(feedback)
        await self._db.flush()
        logger.info(
            "feedback_created",
            user_id=str(self._user_id),
            email_log_id=str(data.email_log_id),
            rating=data.rating,
        )
        return feedback

    async def list_by_user(self) -> list[Feedback]:
        """Return all feedback submitted by this user."""
        result = await self._db.execute(
            select(Feedback)
            .where(Feedback.user_id == self._user_id)
            .order_by(Feedback.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_average_rating(self) -> float:
        """Return the average rating across all feedback by this user."""
        feedbacks = await self.list_by_user()
        if not feedbacks:
            return 0.0
        return round(sum(f.rating for f in feedbacks) / len(feedbacks), 2)
