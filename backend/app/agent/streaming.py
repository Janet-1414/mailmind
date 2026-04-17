"""
SSE streaming endpoint for MailMind agent replies.
Streams the reply token by token using Server-Sent Events so the
frontend can display words as they are generated rather than waiting
for the full reply. Runs the full pipeline (analyze, retrieve, web_search,
draft) then streams the refine node output token by token.
"""
import json
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from openai import AsyncOpenAI

from app.agent.schemas import ReplyRequest, TokenUsage
from app.agent.graph import MailMindAgent
from app.agent.nodes import AgentNodes
from app.agent.prompts import prompts
from app.auth.service import get_current_user
from app.auth.models import User
from app.cache.service import cache_service
from app.database.base import get_db
from app.memory.models import EmailLog, MemoryLog
from app.memory.service import memory_service
from app.threads.models import Thread
from app.tools.email_analyzer import analyze_email, format_analysis_for_prompt
from app.utils.token_counter import TokenCounter
from app.utils.rate_limiter import limiter
from app.config import settings

logger = logging.getLogger(__name__)
stream_router = APIRouter()


async def _stream_reply(
    email_content: str,
    tone: str,
    model: str,
    hint: str,
    intent: str,
    sentiment: str,
    urgency: str,
    key_points: list,
    retrieved_context: str,
    web_results: str,
    conversation_history: list,
    draft_reply: str,
) -> AsyncGenerator[str, None]:
    """Stream the refine node output token by token via OpenAI streaming."""
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, timeout=settings.OPENAI_TIMEOUT)
    prompt = prompts.refine(tone, draft_reply, hint)

    try:
        stream = await client.chat.completions.create(
            model=model if not model.startswith("claude") else "gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                data = json.dumps({"type": "delta", "content": delta})
                yield f"data: {data}\n\n"
    except Exception as exc:
        logger.error("Streaming error: %s", exc)
        yield f"data: {json.dumps({'type': 'error', 'content': str(exc)})}\n\n"

    yield "data: [DONE]\n\n"


@stream_router.post("/reply/stream")
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def stream_reply(
    request: Request,
    req: ReplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stream the agent reply token by token using SSE."""
    s = req.settings
    is_correction = req.hint.startswith("The previous reply was rejected")

    # ── Resolve thread ────────────────────────────────────────────────────────
    thread = None
    if req.thread_id:
        thread = db.query(Thread).filter(
            Thread.id == req.thread_id,
            Thread.user_id == current_user.id,
        ).first()

    if is_correction and thread:
        last_log = (
            db.query(EmailLog)
            .filter(EmailLog.thread_id == thread.id)
            .order_by(EmailLog.created_at.desc())
            .first()
        )
        if last_log:
            db.delete(last_log)
            db.commit()

    history = []
    if thread:
        history = [
            {"email_content": log.email_content, "reply": log.reply}
            for log in thread.email_logs[-settings.MAX_HISTORY_EXCHANGES:]
        ]

    # ── Run pipeline up to draft (non-streaming) ──────────────────────────────
    nodes = AgentNodes()
    state = MailMindAgent.build_initial_state(
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

    state = {**state, **await nodes.analyze(state)}
    state = {**state, **await nodes.retrieve(state)}
    state = {**state, **await nodes.web_search(state)}
    state = {**state, **await nodes.draft(state)}

    # ── Collect full streamed reply then persist ───────────────────────────────
    full_reply = []

    async def event_generator():
        async for chunk in _stream_reply(
            email_content=req.email_content,
            tone=s.tone,
            model=s.model,
            hint=req.hint,
            intent=state.get("intent", ""),
            sentiment=state.get("sentiment", "neutral"),
            urgency=state.get("urgency", "medium"),
            key_points=state.get("key_points", []),
            retrieved_context="\n---\n".join(state.get("retrieved_context", [])),
            web_results=state.get("search_results", ""),
            conversation_history=history,
            draft_reply=state.get("draft_reply", ""),
        ):
            if chunk.startswith("data: {"):
                try:
                    data = json.loads(chunk.replace("data: ", "").strip())
                    if data.get("type") == "delta":
                        full_reply.append(data["content"])
                except Exception:
                    pass
            yield chunk

        # After streaming completes — persist to DB
        refined = "".join(full_reply)
        if refined:
            now = datetime.now(timezone.utc)

            if not thread:
                title   = req.email_content[:60].strip().replace("\n", " ")
                new_thread = Thread(user_id=current_user.id, title=title, updated_at=now)
                db.add(new_thread)
                db.commit()
                db.refresh(new_thread)
                thread_id = new_thread.id
            else:
                thread.updated_at = now
                thread_id = thread.id

            # Save confidence score
            try:
                score_text, _ = await nodes._call_llm(
                    {**state, "final_reply": refined},
                    prompts.confidence(req.email_content, refined),
                )
                confidence = max(0.0, min(1.0, float(score_text.strip())))
            except Exception:
                confidence = None

            counter = TokenCounter(s.model)
            log = EmailLog(
                user_id=current_user.id,
                thread_id=thread_id,
                email_content=req.email_content,
                hint="" if is_correction else req.hint,
                reply=refined,
                tone=s.tone,
                model=s.model,
                prompt_tokens=state.get("prompt_tokens", 0),
                completion_tokens=state.get("completion_tokens", 0),
                total_tokens=state.get("total_tokens", 0),
                cost_usd=state.get("cost_usd", 0.0),
                cached=False,
                confidence_score=confidence,
                created_at=now,
            )
            db.add(log)
            db.commit()
            db.refresh(log)

            # Save to Pinecone memory + DB
            try:
                memory_content = (
                    f"Email: {req.email_content[:300]}\n"
                    f"Tone: {s.tone}\n"
                    f"Reply: {refined[:300]}"
                )
                vector_id = memory_service.store(
                    user_id=str(current_user.id),
                    content=memory_content,
                    namespace=f"user-{current_user.id}",
                )
                if vector_id:
                    mem_log = MemoryLog(
                        user_id=current_user.id,
                        pinecone_id=vector_id,
                        content=memory_content,
                    )
                    db.add(mem_log)
                    db.commit()
            except Exception as exc:
                logger.warning("Memory persist failed: %s", exc)

            # Send final metadata to frontend
            meta = json.dumps({
                "type":         "done",
                "email_log_id": log.id,
                "thread_id":    thread_id,
                "confidence_score": confidence,
                "memory_used":  state.get("memory_used", False),
                "sources":      state.get("sources", []),
                "usage": {
                    "prompt_tokens":     state.get("prompt_tokens", 0),
                    "completion_tokens": state.get("completion_tokens", 0),
                    "total_tokens":      state.get("total_tokens", 0),
                    "cost_usd":          state.get("cost_usd", 0.0),
                },
            })
            yield f"data: {meta}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "X-Accel-Buffering":           "no",
            "Access-Control-Allow-Origin": "*",
        },
    )
