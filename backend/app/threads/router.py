from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.auth.service import get_current_user
from app.auth.models import User
from app.database.base import get_db
from app.threads.models import Thread
from app.threads.schemas import ThreadCreate, ThreadResponse, ThreadSummary
from app.memory.models import EmailLog

router = APIRouter()


@router.post("", response_model=ThreadResponse)
def create_thread(
    req: ThreadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    thread = Thread(user_id=current_user.id, title=req.title or "New thread")
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return _build_response(thread)


@router.get("", response_model=List[ThreadSummary])
def list_threads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    threads = (
        db.query(Thread)
        .filter(Thread.user_id == current_user.id)
        .order_by(Thread.updated_at.desc())
        .all()
    )
    return [
        ThreadSummary(
            id=t.id,
            title=t.title,
            updated_at=t.updated_at,
            exchange_count=len(t.email_logs),
        )
        for t in threads
    ]


@router.get("/{thread_id}", response_model=ThreadResponse)
def get_thread(
    thread_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    thread = _get_or_404(db, thread_id, current_user.id)
    return _build_response(thread)


@router.patch("/{thread_id}/title")
def rename_thread(
    thread_id: str,
    body: ThreadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    thread = _get_or_404(db, thread_id, current_user.id)
    thread.title = body.title
    db.commit()
    return {"success": True}


@router.delete("/{thread_id}")
def delete_thread(
    thread_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    thread = _get_or_404(db, thread_id, current_user.id)
    db.delete(thread)
    db.commit()
    return {"success": True}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_or_404(db: Session, thread_id: str, user_id: str) -> Thread:
    thread = db.query(Thread).filter(
        Thread.id == thread_id,
        Thread.user_id == user_id,
    ).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found.")
    return thread


def _build_response(thread: Thread) -> ThreadResponse:
    return ThreadResponse(
        id=thread.id,
        title=thread.title,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        exchanges=[
            {
                "id": log.id,
                "email_content": log.email_content,
                "hint": log.hint or "",
                "reply": log.reply,
                "tone": log.tone,
                "model": log.model,
                "created_at": log.created_at,
            }
            for log in thread.email_logs
        ],
    )
