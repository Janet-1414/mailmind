"""
templates/service.py — CRUD operations for email templates.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.templates.models import EmailTemplate
from app.templates.schemas import TemplateCreate, TemplateUpdate
from app.utils.logger import get_logger

logger = get_logger(__name__)


class TemplateService:
    """Manages email template CRUD for a specific user."""

    def __init__(self, db: AsyncSession, user_id: uuid.UUID) -> None:
        self._db = db
        self._user_id = user_id

    async def create(self, data: TemplateCreate) -> EmailTemplate:
        template = EmailTemplate(
            user_id=self._user_id,
            title=data.title,
            content=data.content,
            tone=data.tone,
            tags=data.tags,
        )
        self._db.add(template)
        await self._db.flush()
        logger.info("template_created", user_id=str(self._user_id), template_id=str(template.id))
        return template

    async def list_all(self, search: str | None = None) -> list[EmailTemplate]:
        query = select(EmailTemplate).where(EmailTemplate.user_id == self._user_id)
        if search:
            query = query.where(EmailTemplate.title.ilike(f"%{search}%"))
        query = query.order_by(EmailTemplate.created_at.desc())
        result = await self._db.execute(query)
        return list(result.scalars().all())

    async def get(self, template_id: uuid.UUID) -> EmailTemplate | None:
        result = await self._db.execute(
            select(EmailTemplate).where(
                EmailTemplate.id == template_id,
                EmailTemplate.user_id == self._user_id,
            )
        )
        return result.scalar_one_or_none()

    async def update(self, template_id: uuid.UUID, data: TemplateUpdate) -> EmailTemplate | None:
        template = await self.get(template_id)
        if not template:
            return None
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(template, field, value)
        await self._db.flush()
        return template

    async def delete(self, template_id: uuid.UUID) -> bool:
        template = await self.get(template_id)
        if not template:
            return False
        await self._db.delete(template)
        return True
