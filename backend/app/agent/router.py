"""
FastAPI router for the MailMind agent — POST /agent/reply.
Accepts a validated email payload, checks Redis cache, runs the LangGraph
pipeline on miss, persists result to DB, and returns the reply with usage,
confidence score, and thread info. Rate limited to prevent API abuse.
"""
import logging
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.agent.schemas import ReplyRequest, ReplyResponse, TokenUsage
from app.agent.graph import mailmind_agent, MailMindAgent
from app.auth.service import get_current_user
from app.auth.models import User
from app.cache.service import cache_service
from app.database.base import get_db
from app.memory.models import EmailLog
from app.threads.models import Thread
from app.utils.rate_limiter import limiter
from app.config import settings

logger  = logging.getLogger(__name__)
router  = APIRouter()


@router.post("/reply", response_model=ReplyResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def generate_reply(
    request: Request,
    req: ReplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s = req.settings

    # ── Thread resolution ──────────────────────────────────────────────────────
    if req.thread_id:
        thread = db.query(Thread).filter(
            Thread.id == req.thread_id,
            Thread.user_id == current_user.id,
        ).first()
    else:
        thread = None

    if not thread:
        title = req.email_content[:60].strip().replace("\n", " ")
        thread = Thread(user_id=current_user.id, title=title)
        db.add(thread)
        db.commit()
        db.refresh(thread)

    # ── Conversation history (last N exchanges only) ──────────────────────────
    history = [
        {"email_content": log.email_content, "reply": log.reply}
        for log in thread.email_logs[-settings.MAX_HISTORY_EXCHANGES:]
    ]

    # ── Cache check ───────────────────────────────────────────────────────────
    cached_data = cache_service.get(req.email_content, s.tone, s.model, req.hint)
    if cached_data:
        logger.info("Cache hit for user %s", current_user.id)
        return ReplyResponse(**{**cached_data, "cached": True, "thread_id": thread.id})

    # ── Build initial state and run agent ─────────────────────────────────────
    initial_state = MailMindAgent.build_initial_state(
        email_content=req.email_content,
        tone=s.tone,
        model=s.model,
        temperature=s.temperature,
        top_p=s.top_p,
        frequency_penalty=s.frequency_penalty,
        web_search_enabled=s.web_search_enabled,
        user_id=str(current_user.id),
        hint=req.hint,
        conversation_history=history,
    )

    final_state = await mailmind_agent.run(initial_state)

    # ── Persist to DB ─────────────────────────────────────────────────────────
    log = EmailLog(
        user_id=current_user.id,
        thread_id=thread.id,
        email_content=req.email_content,
        hint=req.hint if not req.hint.startswith("The previous reply was rejected") else "",
        reply=final_state["final_reply"],
        tone=s.tone,
        model=s.model,
        prompt_tokens=final_state["prompt_tokens"],
        completion_tokens=final_state["completion_tokens"],
        total_tokens=final_state["total_tokens"],
        cost_usd=final_state["cost_usd"],
        cached=False,
        confidence_score=final_state.get("confidence_score"),
    )
    db.add(log)
    from datetime import datetime, timezone
    thread.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(log)

    response = ReplyResponse(
        email_log_id=log.id,
        thread_id=thread.id,
        reply=final_state["final_reply"],
        usage=TokenUsage(
            prompt_tokens=final_state["prompt_tokens"],
            completion_tokens=final_state["completion_tokens"],
            total_tokens=final_state["total_tokens"],
            cost_usd=final_state["cost_usd"],
        ),
        cached=False,
        sources=final_state.get("sources", []),
        memory_used=final_state.get("memory_used", False),
        confidence_score=final_state.get("confidence_score"),
    )

    # ── Cache the result ──────────────────────────────────────────────────────
    cache_service.set(req.email_content, s.tone, s.model, response.model_dump(), req.hint)

    return response
