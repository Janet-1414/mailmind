"""
templates/router.py — email template CRUD endpoints.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.router import get_current_user
from app.database.connection import get_db
from app.templates.schemas import TemplateCreate, TemplateResponse, TemplateUpdate
from app.templates.service import TemplateService

router = APIRouter(prefix="/templates", tags=["templates"])


@router.post("/", response_model=TemplateResponse, status_code=201)
async def create_template(
    data: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> TemplateResponse:
    service = TemplateService(db, current_user.id)
    template = await service.create(data)
    return TemplateResponse.model_validate(template)


@router.get("/", response_model=list[TemplateResponse])
async def list_templates(
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[TemplateResponse]:
    service = TemplateService(db, current_user.id)
    templates = await service.list_all(search=search)
    return [TemplateResponse.model_validate(t) for t in templates]


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> TemplateResponse:
    service = TemplateService(db, current_user.id)
    template = await service.get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return TemplateResponse.model_validate(template)


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: uuid.UUID,
    data: TemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> TemplateResponse:
    service = TemplateService(db, current_user.id)
    template = await service.update(template_id, data)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return TemplateResponse.model_validate(template)


@router.delete("/{template_id}", status_code=204)
async def delete_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> None:
    service = TemplateService(db, current_user.id)
    deleted = await service.delete(template_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Template not found")
