"""
agent/nodes.py — all LangGraph node implementations as class methods.
"""

import json
import time
import uuid
from typing import Any

from anthropic import AsyncAnthropic
from openai import AsyncOpenAI

from app.agent.prompts import AgentPrompts
from app.agent.state import AgentState
from app.config import get_settings
from app.tools.email_analyzer import EmailAnalyzerTool
from app.tools.web_search import WebSearchTool
from app.utils.logger import get_logger
from app.utils.retry import async_retry

logger = get_logger(__name__)
settings = get_settings()


class AgentNodes:
    """
    All LangGraph node functions as methods of a single class.
    Each method receives and returns AgentState.
    """

    def __init__(self) -> None:
        self._openai = AsyncOpenAI(
            api_key=settings.openai_api_key, timeout=30.0
        )
        self._anthropic = AsyncAnthropic(
            api_key=settings.anthropic_api_key, timeout=30.0
        )
        self._analyzer = EmailAnalyzerTool()
        self._web_search = WebSearchTool()
        self._prompts = AgentPrompts()

    # ── Helper ───────────────────────────────────────────────────

    @async_retry(max_attempts=3, base_delay=1.0)
    async def _call_llm(self, model: str, system: str, user: str) -> tuple[str, int]:
        """Call OpenAI or Anthropic and return (text, tokens_used)."""
        start = time.perf_counter()
        if model.startswith("claude"):
            response = await self._anthropic.messages.create(
                model=model,
                max_tokens=1500,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            text = response.content[0].text
            tokens = response.usage.input_tokens + response.usage.output_tokens
        else:
            response = await self._openai.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                max_tokens=1500,
            )
            text = response.choices[0].message.content or ""
            tokens = response.usage.total_tokens if response.usage else 0

        elapsed = round(time.perf_counter() - start, 3)
        logger.info("llm_call_complete", model=model, tokens=tokens, elapsed_s=elapsed)
        return text, tokens

    # ── Node: analyze ────────────────────────────────────────────

    async def analyze(self, state: AgentState) -> AgentState:
        """Run EmailAnalyzerTool then summarise with LLM."""
        logger.info("node_analyze_start")
        analysis = self._analyzer.analyze(state["email_content"])

        summary = (
            f"Urgency: {analysis.urgency_level} | "
            f"Questions: {analysis.question_count} | "
            f"Sentiment: {analysis.sentiment_hint} | "
            f"Action required: {analysis.requires_action} | "
            f"Words: {analysis.word_count}"
        )

        state["email_analysis"] = {
            "is_urgent": analysis.is_urgent,
            "urgency_level": analysis.urgency_level,
            "question_count": analysis.question_count,
            "sentiment_hint": analysis.sentiment_hint,
            "requires_action": analysis.requires_action,
            "summary": summary,
        }
        logger.info("node_analyze_complete", urgency=analysis.urgency_level)
        return state

    # ── Node: retrieve ───────────────────────────────────────────

    async def retrieve(self, state: AgentState) -> AgentState:
        """Retrieve relevant memories from Pinecone."""
        logger.info("node_retrieve_start")
        try:
            from app.memory.service import MemoryService
            from app.database.connection import db_connection
            from sqlalchemy.ext.asyncio import AsyncSession

            user_id = uuid.UUID(state["user_id"])
            async with db_connection._session_factory() as session:
                service = MemoryService(session, user_id)
                memories = await service.retrieve(state["email_content"], top_k=5)
            state["memories"] = memories
            state["pinecone_available"] = True
            logger.info("node_retrieve_complete", memories=len(memories))
        except Exception as exc:
            logger.warning("node_retrieve_failed", error=str(exc))
            state["memories"] = []
            state["pinecone_available"] = False
        return state

    # ── Node: web_search ─────────────────────────────────────────

    async def web_search(self, state: AgentState) -> AgentState:
        """Perform a web search for additional context."""
        logger.info("node_web_search_start")
        try:
            query = state["email_content"][:200]
            results = await self._web_search.search(query, max_results=3)
            state["web_results"] = results
        except Exception as exc:
            logger.warning("node_web_search_failed", error=str(exc))
            state["web_results"] = []
        return state

    # ── Node: draft ──────────────────────────────────────────────

    async def draft(self, state: AgentState) -> AgentState:
        """Generate the initial reply draft."""
        logger.info("node_draft_start")
        analysis = state.get("email_analysis", {})
        prompt = self._prompts.draft_prompt(
            email_content=state["email_content"],
            tone=state.get("tone", "professional"),
            hint=state.get("hint", ""),
            memories=state.get("memories", []),
            web_results=state.get("web_results", []),
            history=state.get("history", []),
            analysis_summary=analysis.get("summary", ""),
        )
        text, tokens = await self._call_llm(
            model=state.get("model", "gpt-4o-mini"),
            system=self._prompts.SYSTEM_BASE,
            user=prompt,
        )
        state["draft_reply"] = text
        state["total_tokens"] = state.get("total_tokens", 0) + tokens
        state["model_used"] = state.get("model", "gpt-4o-mini")
        logger.info("node_draft_complete")
        return state

    # ── Node: refine ─────────────────────────────────────────────

    async def refine(self, state: AgentState) -> AgentState:
        """Polish the draft into the final reply."""
        logger.info("node_refine_start")
        prompt = self._prompts.refine_prompt(
            draft=state["draft_reply"],
            email_content=state["email_content"],
            tone=state.get("tone", "professional"),
            hint=state.get("hint", ""),
        )
        text, tokens = await self._call_llm(
            model=state.get("model", "gpt-4o-mini"),
            system=self._prompts.SYSTEM_BASE,
            user=prompt,
        )
        state["final_reply"] = text
        state["total_tokens"] = state.get("total_tokens", 0) + tokens
        logger.info("node_refine_complete")
        return state

    # ── Node: score_confidence ───────────────────────────────────

    async def score_confidence(self, state: AgentState) -> AgentState:
        """Score the reply quality from 0-100."""
        logger.info("node_confidence_start")
        try:
            prompt = self._prompts.confidence_prompt(
                email_content=state["email_content"],
                final_reply=state["final_reply"],
                tone=state.get("tone", "professional"),
                hint=state.get("hint", ""),
                memories=state.get("memories", []),
            )
            text, tokens = await self._call_llm(
                model=state.get("model", "gpt-4o-mini"),
                system="You are a JSON-only scoring assistant. Respond ONLY with valid JSON.",
                user=prompt,
            )
            state["total_tokens"] = state.get("total_tokens", 0) + tokens

            # Strip markdown fences if present
            clean = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            scores = json.loads(clean)
            state["confidence_score"] = min(100, max(0, int(scores.get("total", 75))))
            state["confidence_breakdown"] = {
                "context_match": scores.get("context_match", 0),
                "tone_consistency": scores.get("tone_consistency", 0),
                "hint_compliance": scores.get("hint_compliance", 0),
            }
        except Exception as exc:
            logger.warning("confidence_scoring_failed", error=str(exc))
            state["confidence_score"] = 75
            state["confidence_breakdown"] = {
                "context_match": 30,
                "tone_consistency": 25,
                "hint_compliance": 20,
            }
        logger.info("node_confidence_complete", score=state["confidence_score"])
        return state
