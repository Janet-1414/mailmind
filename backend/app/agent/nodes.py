"""
LangGraph agent node implementations for MailMind.
Each async method corresponds to one node in the pipeline:
  - analyze:    extracts intent, urgency, sentiment and key points
  - retrieve:   fetches relevant past context from Pinecone memory
  - web_search: optionally searches the web via Tavily
  - draft:      generates the initial reply using all available context
  - refine:     polishes the draft, enforces tone and hint, persists to memory
  - score:      generates a confidence score for the final reply
LLM clients are configured with timeouts to prevent indefinite blocking.
"""
import json
import logging
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from app.agent.state import AgentState
from app.agent.prompts import prompts
from app.memory.service import memory_service
from app.tools.web_search import search_web
from app.tools.email_analyzer import analyze_email, format_analysis_for_prompt
from app.utils.token_counter import TokenCounter
from app.utils.retry import RetryHandler
from app.config import settings

logger = logging.getLogger(__name__)

COST_TABLE = {
    "gpt-4o":            (0.005,   0.015),
    "gpt-4o-mini":       (0.00015, 0.0006),
    "gpt-3.5-turbo":     (0.0005,  0.0015),
    "claude-3-5-haiku":  (0.00025, 0.00125),
}


class AgentNodes:
    """All LangGraph node implementations for the MailMind agent pipeline."""

    def __init__(self):
        # Clients configured with timeouts to prevent hanging requests
        self._openai   = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            timeout=settings.OPENAI_TIMEOUT,
        )
        self._anthropic = AsyncAnthropic(
            api_key=settings.ANTHROPIC_API_KEY,
            timeout=settings.ANTHROPIC_TIMEOUT,
        )

    @RetryHandler(max_retries=3, backoff_factor=2.0)
    async def _call_llm(self, state: AgentState, prompt: str) -> tuple[str, object]:
        """Call the appropriate LLM based on the model in state. Returns (text, usage)."""
        model = state["model"]
        if model.startswith("claude"):
            response = await self._anthropic.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}],
            )
            text  = response.content[0].text
            usage = response.usage
        else:
            response = await self._openai.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1000,
                temperature=state.get("temperature", 0.7),
                top_p=state.get("top_p", 1.0),
                frequency_penalty=state.get("frequency_penalty", 0.0),
            )
            text  = response.choices[0].message.content or ""
            usage = response.usage
        return text, usage

    async def analyze(self, state: AgentState) -> AgentState:
        """Analyze the email and extract intent, sentiment, urgency, key points.
        Also runs structural analysis via EmailAnalyzerTool before LLM call."""
        # Run structural pre-analysis
        struct = analyze_email(state["email_content"])
        struct_summary = format_analysis_for_prompt(struct)
        logger.info("Structural analysis: %s", struct_summary)

        text, usage = await self._call_llm(state, prompts.analyze(state["email_content"]))
        counter = TokenCounter(state["model"], usage)

        try:
            parsed = json.loads(text)
            intent    = parsed.get("intent", "general inquiry")
            sentiment = parsed.get("sentiment", "neutral")
            urgency   = parsed.get("urgency", struct.urgency_signals[0] if struct.urgency_signals else "medium")
            key_points = parsed.get("key_points", [])
        except (json.JSONDecodeError, AttributeError):
            intent, sentiment, urgency, key_points = "general inquiry", "neutral", "medium", []

        return {
            **state,
            "analysis":   text,
            "intent":     intent,
            "sentiment":  sentiment,
            "urgency":    urgency if struct.is_urgent else urgency,
            "key_points": key_points,
            **counter.to_dict(),
        }

    async def retrieve(self, state: AgentState) -> AgentState:
        """Retrieve relevant past interactions from Pinecone memory."""
        try:
            query    = f"{state['intent']} {state['email_content'][:200]}"
            contexts = memory_service.retrieve(
                user_id=state["user_id"],
                query=query,
                namespace=f"user-{state['user_id']}",
            )
        except Exception as exc:
            logger.warning("Memory retrieval failed (non-fatal): %s", exc)
            contexts = []

        return {
            **state,
            "retrieved_context": contexts,
            "memory_used":       len(contexts) > 0,
        }

    async def web_search(self, state: AgentState) -> AgentState:
        """Optionally search the web via Tavily. Skipped if web_search_enabled is False."""
        if not state.get("web_search_enabled"):
            return {**state, "search_results": ""}
        try:
            results = await search_web(state["email_content"])
            return {**state, "search_results": results}
        except Exception as exc:
            logger.warning("Web search failed (non-fatal): %s", exc)
            return {**state, "search_results": ""}

    async def draft(self, state: AgentState) -> AgentState:
        """Generate the initial reply draft using all available context."""
        ctx_text = "\n---\n".join(state.get("retrieved_context", []))
        prompt   = prompts.draft(
            intent=state.get("intent", ""),
            sentiment=state.get("sentiment", "neutral"),
            urgency=state.get("urgency", "medium"),
            key_points=state.get("key_points", []),
            retrieved_context=ctx_text,
            web_results=state.get("search_results", ""),
            tone=state["tone"],
            email_content=state["email_content"],
            hint=state.get("hint", ""),
            conversation_history=state.get("conversation_history", []),
        )
        draft_text, usage = await self._call_llm(state, prompt)
        counter = TokenCounter(state["model"], usage)
        return {**state, "draft_reply": draft_text, **counter.to_dict()}

    async def refine(self, state: AgentState) -> AgentState:
        """Polish the draft, enforce tone and hint, persist to Pinecone memory."""
        refined, usage = await self._call_llm(
            state,
            prompts.refine(state["tone"], state["draft_reply"], state.get("hint", "")),
        )
        counter = TokenCounter(state["model"], usage)

        sources: list[str] = []
        if state.get("memory_used"):
            sources.append("Long-term memory")
        if state.get("search_results"):
            sources.append("Web search")

        # Persist to Pinecone memory with per-user namespace
        try:
            memory_content = (
                f"Email: {state['email_content'][:300]}\n"
                f"Tone: {state['tone']}\n"
                f"Reply: {refined[:300]}"
            )
            memory_service.store(
                user_id=state["user_id"],
                content=memory_content,
                namespace=f"user-{state['user_id']}",
            )
        except Exception as exc:
            logger.warning("Failed to persist memory (non-fatal): %s", exc)

        return {
            **state,
            "draft_reply": refined,
            "final_reply": refined,
            "sources":     sources,
            **counter.to_dict(),
        }

    async def score(self, state: AgentState) -> AgentState:
        """Generate a confidence score (0.0-1.0) for the final reply."""
        try:
            text, usage = await self._call_llm(
                state,
                prompts.confidence(state["email_content"], state["final_reply"]),
            )
            score = float(text.strip())
            score = max(0.0, min(1.0, score))
        except Exception as exc:
            logger.warning("Confidence scoring failed (non-fatal): %s", exc)
            score = None
        return {**state, "confidence_score": score}
