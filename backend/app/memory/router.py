"""
FastAPI router for long-term memory — /memory prefix.
Exposes endpoints to list all memory items, delete a single item,
clear all memories, and trigger manual pruning of old memories.
All routes require authentication.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.auth.service import get_current_user
from app.auth.models import User
from app.database.base import get_db
from app.memory.models import MemoryLog
from app.memory.schemas import MemoryItem
from app.memory.service import memory_service

router = APIRouter()


@router.get("", response_model=List[MemoryItem])
def list_memory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logs = (
        db.query(MemoryLog)
        .filter(MemoryLog.user_id == current_user.id)
        .order_by(MemoryLog.created_at.desc())
        .all()
    )
    return [MemoryItem(id=l.pinecone_id, content=l.content, created_at=l.created_at) for l in logs]


@router.delete("/{item_id}")
def delete_memory_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(MemoryLog).filter(
        MemoryLog.pinecone_id == item_id,
        MemoryLog.user_id == current_user.id,
    ).first()
    if log:
        memory_service.delete(item_id, str(current_user.id), namespace=f"user-{current_user.id}")
        db.delete(log)
        db.commit()
    return {"success": True}


@router.delete("")
def clear_all_memory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memory_service.delete_all(str(current_user.id), namespace=f"user-{current_user.id}")
    db.query(MemoryLog).filter(MemoryLog.user_id == current_user.id).delete()
    db.commit()
    return {"success": True, "deleted": "all"}


@router.post("/prune")
def prune_memory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually trigger memory pruning for the current user."""
    pruned = memory_service.prune_old_memories(db, str(current_user.id), namespace=f"user-{current_user.id}")
    return {"success": True, "pruned": pruned}
