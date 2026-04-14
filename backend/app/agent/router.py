"""
agent/router.py — /agent/reply (standard + streaming) with per-user rate limiting.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.graph import agent_graph
from app.agent.schemas import ReplyRequest, ReplyResponse
from app.agent.streaming import StreamingHandler
from app.agent.state import AgentState
from app.auth.router import get_current_user
from app.database.connection import get_db
from app.memory.service import MemoryService
from app.threads.models import EmailLog, Thread
from app.utils.logger import get_logger, generate_correlation_id
from app.utils.rate_limiter import limiter
from app.utils.token_counter import TokenCounter

logger = get_logger(__name__)
router = APIRouter(prefix="/agent", tags=["agent"])
_streaming_handler = StreamingHandler()


async def _get_or_create_thread(
    db: AsyncSession, user_id: uuid.UUID, thread_id: uuid.UUID | None
) -> Thread:
    """Return an existing thread or create a new one."""
    if thread_id:
        result = await db.execute(
            select(Thread)
            .where(Thread.id == thread_id, Thread.user_id == user_id)
            .options(selectinload(Thread.email_logs))
        )
        thread = result.scalar_one_or_none()
        if thread:
            return thread

    # Create new thread and eagerly load email_logs as empty list
    thread = Thread(user_id=user_id, title="New Thread")
    db.add(thread)
    await db.flush()

    # Re-fetch with selectinload so email_logs is properly initialized
    result = await db.execute(
        select(Thread)
        .where(Thread.id == thread.id)
        .options(selectinload(Thread.email_logs))
    )
    thread = result.scalar_one()
    return thread


async def _build_history(thread: Thread) -> list[dict[str, Any]]:
    """Return last 10 exchanges with token budget guard."""
    counter = TokenCounter()
    try:
        logs = thread.email_logs[-10:] if thread.email_logs else []
    except Exception:
        logs = []
    raw = [
        {"email_content": log.email_content, "reply": log.reply}
        for log in logs
    ]
    return counter.truncate_history(raw, max_exchanges=10, max_tokens=6000)


@router.post("/reply", response_model=ReplyResponse)
@limiter.limit("20/hour")
async def generate_reply(
    request: Request,
    data: ReplyRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> ReplyResponse:
    """Generate a full (non-streaming) AI email reply."""
    cid = generate_correlation_id()
    log = logger.bind(correlation_id=cid, user_id=str(current_user.id))
    log.info("reply_request_received", model=data.model)

    # Thread + history
    thread = await _get_or_create_thread(db, current_user.id, data.thread_id)
    history = await _build_history(thread)

    # Build initial state
    initial_state: AgentState = {
        "email_content": data.email_content,
        "hint": data.hint,
        "tone": data.tone,
        "model": data.model,
        "thread_id": str(thread.id),
        "user_id": str(current_user.id),
        "web_search_enabled": data.web_search_enabled,
        "history": history,
        "pinecone_available": True,
        "total_tokens": 0,
    }

    # Run graph
    try:
        final_state = await agent_graph.run(initial_state)
    except Exception as exc:
        log.error("graph_execution_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="Agent execution failed")

    final_reply = final_state.get("final_reply", "")
    if not final_reply:
        raise HTTPException(status_code=500, detail="Agent produced no reply")

    # Persist email log
    email_log = EmailLog(
        thread_id=thread.id,
        email_content=data.email_content,
        reply=final_reply,
        model_used=final_state.get("model_used", data.model),
        tokens_used=final_state.get("total_tokens", 0),
        confidence_score=final_state.get("confidence_score", 0),
    )
    db.add(email_log)
    await db.flush()

    # Store reply as memory
    try:
        mem_service = MemoryService(db, current_user.id)
        await mem_service.store(f"Email: {data.email_content[:300]} | Reply: {final_reply[:300]}")
    except Exception as exc:
        log.warning("memory_store_failed", error=str(exc))

    log.info("reply_generated", confidence=final_state.get("confidence_score"))

    return ReplyResponse(
        reply=final_reply,
        confidence_score=final_state.get("confidence_score", 0),
        confidence_breakdown=final_state.get("confidence_breakdown", {}),
        tokens_used=final_state.get("total_tokens", 0),
        model_used=final_state.get("model_used", data.model),
        email_analysis=final_state.get("email_analysis", {}),
        thread_id=thread.id,
        email_log_id=email_log.id,
    )


@router.post("/reply/stream")
@limiter.limit("20/hour")
async def stream_reply(
    request: Request,
    data: ReplyRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
) -> StreamingResponse:
    """Stream the AI reply token by token via SSE."""
    cid = generate_correlation_id()
    logger.info("stream_request_received", user_id=str(current_user.id), correlation_id=cid)

    thread = await _get_or_create_thread(db, current_user.id, data.thread_id)
    history = await _build_history(thread)

    # Retrieve memories for context
    memories: list[dict] = []
    try:
        mem_service = MemoryService(db, current_user.id)
        memories = await mem_service.retrieve(data.email_content, top_k=5)
    except Exception:
        pass

    async def event_generator():
        async for chunk in _streaming_handler.stream_reply(
            email_content=data.email_content,
            hint=data.hint,
            tone=data.tone,
            model=data.model,
            memories=memories,
            history=history,
        ):
            yield chunk

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )