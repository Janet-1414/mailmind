"""
threads/router.py — CRUD endpoints for conversation threads.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.router import get_current_user
from app.database.connection import get_db
from app.threads.models import Thread
from app.threads.schemas import ThreadCreate, ThreadResponse

router = APIRouter(prefix="/threads", tags=["threads"])

@router.post("/", response_model=ThreadResponse, status_code=201)
async def create_thread(
    data: ThreadCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ThreadResponse:
    thread = Thread(user_id=current_user.id, title=data.title)
    db.add(thread)
    await db.flush()
    return ThreadResponse.model_validate(thread)

@router.get("/", response_model=list[ThreadResponse])
async def list_threads(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[ThreadResponse]:
    result = await db.execute(
        select(Thread)
        .where(Thread.user_id == current_user.id)
        .options(selectinload(Thread.email_logs))
        .order_by(Thread.created_at.desc())
    )
    threads = result.scalars().all()
    return [ThreadResponse.model_validate(t) for t in threads]

@router.get("/{thread_id}", response_model=ThreadResponse)
async def get_thread(
    thread_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ThreadResponse:
    result = await db.execute(
        select(Thread)
        .where(Thread.id == thread_id, Thread.user_id == current_user.id)
        .options(selectinload(Thread.email_logs))
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    return ThreadResponse.model_validate(thread)

@router.put("/{thread_id}", response_model=ThreadResponse)
async def update_thread(
    thread_id: uuid.UUID,
    data: ThreadCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ThreadResponse:
    result = await db.execute(
        select(Thread)
        .where(Thread.id == thread_id, Thread.user_id == current_user.id)
        .options(selectinload(Thread.email_logs))
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    thread.title = data.title
    await db.flush()
    return ThreadResponse.model_validate(thread)

@router.delete("/{thread_id}", status_code=204)
async def delete_thread(
    thread_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> None:
    result = await db.execute(
        select(Thread).where(Thread.id == thread_id, Thread.user_id == current_user.id)
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    await db.delete(thread)