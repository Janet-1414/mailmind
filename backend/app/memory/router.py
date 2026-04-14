"""
memory/router.py — memory CRUD and health endpoints.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.router import get_current_user
from app.database.connection import get_db
from app.memory.schemas import MemoryCreate, MemoryHealthResponse, MemoryResponse
from app.memory.service import MemoryService

router = APIRouter(prefix="/memory", tags=["memory"])


@router.post("/", response_model=MemoryResponse, status_code=201)
async def store_memory(
    data: MemoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> MemoryResponse:
    service = MemoryService(db, current_user.id)
    log = await service.store(data.content)
    return MemoryResponse.model_validate(log)


@router.get("/", response_model=list[MemoryResponse])
async def list_memories(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[MemoryResponse]:
    service = MemoryService(db, current_user.id)
    memories = await service.list_all()
    return [MemoryResponse.model_validate(m) for m in memories]


@router.get("/health", response_model=MemoryHealthResponse)
async def memory_health(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> MemoryHealthResponse:
    service = MemoryService(db, current_user.id)
    health = await service.get_health()
    return MemoryHealthResponse(**health)


@router.delete("/{memory_id}", status_code=204)
async def delete_memory(
    memory_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> None:
    service = MemoryService(db, current_user.id)
    deleted = await service.delete(memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory not found")
