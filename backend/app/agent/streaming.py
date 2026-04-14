"""
agent/streaming.py — Server-Sent Events streaming for token-by-token reply output.
"""
import json
from collections.abc import AsyncGenerator
from typing import Any
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


class StreamingHandler:
    """Streams LLM tokens via Server-Sent Events."""

    def __init__(self) -> None:
        self._openai = AsyncOpenAI(api_key=settings.openai_api_key, timeout=30.0)
        self._anthropic = AsyncAnthropic(api_key=settings.anthropic_api_key, timeout=30.0)

    def _sse_event(self, data: dict[str, Any]) -> str:
        """Format a dict as an SSE data line."""
        return f"data: {json.dumps(data)}\n\n"

    def _compute_confidence(self, full_text: str, hint: str, tone: str) -> dict:
        """Compute confidence score based on reply quality."""
        text_len = len(full_text.strip())
        words = full_text.strip().split()
        word_count = len(words)

        # ── Context match ─────────────────────────────────────────
        # A good reply is 50-300 words — score peaks in that range
        if word_count >= 50:
            context_match = 95
        elif word_count >= 30:
            context_match = 85
        elif word_count >= 15:
            context_match = 75
        else:
            context_match = 60

        # Boost if reply has structure (greetings, sign-off)
        greetings = ["dear", "hello", "hi ", "good morning", "good afternoon", "thank you"]
        signoffs = ["regards", "sincerely", "best", "cheers", "yours", "warm regards"]
        has_greeting = any(g in full_text.lower() for g in greetings)
        has_signoff = any(s in full_text.lower() for s in signoffs)
        if has_greeting:
            context_match = min(98, context_match + 3)
        if has_signoff:
            context_match = min(98, context_match + 3)

        # ── Tone consistency ──────────────────────────────────────
        tone_keywords = {
            "professional": ["thank", "regard", "please", "appreciate", "sincerely", "kindly", "best"],
            "friendly": ["happy", "great", "sure", "absolutely", "wonderful", "glad", "love"],
            "formal": ["hereby", "pursuant", "accordingly", "respectfully", "dear", "request"],
            "casual": ["yeah", "ok", "sure", "sounds good", "no worries", "awesome", "cool"],
            "empathetic": ["understand", "feel", "sorry", "support", "here for", "difficult", "concern"],
            "assertive": ["will", "must", "require", "expect", "ensure", "commit", "deliver"],
            "concise": [],
        }
        keywords = tone_keywords.get(tone.lower(), [])
        if keywords:
            matches = sum(1 for kw in keywords if kw.lower() in full_text.lower())
            tone_consistency = 70 + min(28, int((matches / len(keywords)) * 28))
        else:
            # concise tone — score based on brevity
            tone_consistency = 95 if word_count <= 80 else 80

        # ── Hint compliance ───────────────────────────────────────
        if hint and hint.strip():
            hint_words = [w for w in hint.lower().split() if len(w) > 3]
            if hint_words:
                matched = sum(1 for word in hint_words if word in full_text.lower())
                ratio = matched / len(hint_words)
                hint_compliance = 60 + int(ratio * 38)
            else:
                hint_compliance = 85
        else:
            hint_compliance = 90  # no hint = full compliance by default

        # ── Overall ───────────────────────────────────────────────
        overall = int((context_match * 0.4) + (tone_consistency * 0.35) + (hint_compliance * 0.25))
        overall = max(60, min(98, overall))

        return {
            "score": overall,
            "breakdown": {
                "context_match": round(context_match),
                "tone_consistency": round(tone_consistency),
                "hint_compliance": round(hint_compliance),
            },
        }

    async def stream_reply(
        self,
        email_content: str,
        hint: str,
        tone: str,
        model: str,
        memories: list[dict],
        history: list[dict],
    ) -> AsyncGenerator[str, None]:
        """
        Yield SSE-formatted strings containing reply tokens.
        Final event contains metadata (confidence, tokens, done flag).
        """
        from app.agent.prompts import AgentPrompts
        from app.tools.email_analyzer import EmailAnalyzerTool

        analyzer = EmailAnalyzerTool()
        analysis = analyzer.analyze(email_content)
        prompts = AgentPrompts()
        prompt = prompts.draft_prompt(
            email_content=email_content,
            tone=tone,
            hint=hint,
            memories=memories,
            web_results=[],
            history=history,
            analysis_summary=analysis.summary_hint,
        )

        full_text = ""
        tokens_used = 0

        try:
            if model.startswith("claude"):
                async with self._anthropic.messages.stream(
                    model=model,
                    max_tokens=1500,
                    system=prompts.SYSTEM_BASE,
                    messages=[{"role": "user", "content": prompt}],
                ) as stream:
                    async for text_chunk in stream.text_stream:
                        full_text += text_chunk
                        yield self._sse_event({"token": text_chunk, "done": False})
                    usage = await stream.get_final_message()
                    tokens_used = usage.usage.input_tokens + usage.usage.output_tokens
            else:
                stream = await self._openai.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": prompts.SYSTEM_BASE},
                        {"role": "user", "content": prompt},
                    ],
                    max_tokens=1500,
                    stream=True,
                )
                async for chunk in stream:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        full_text += delta
                        yield self._sse_event({"token": delta, "done": False})

            # Compute confidence
            confidence = self._compute_confidence(full_text, hint or "", tone or "professional")

            # Build email analysis dict
            email_analysis = {
                "is_urgent": analysis.is_urgent,
                "urgency_level": analysis.urgency_level,
                "question_count": analysis.question_count,
                "sentiment_hint": analysis.sentiment_hint,
                "requires_action": analysis.requires_action,
                "summary": analysis.summary_hint,
            }

            # Final event with full metadata
            yield self._sse_event(
                {
                    "token": "",
                    "done": True,
                    "full_reply": full_text,
                    "tokens_used": tokens_used,
                    "model_used": model,
                    "confidence_score": confidence["score"],
                    "confidence_breakdown": confidence["breakdown"],
                    "email_analysis": email_analysis,
                }
            )
            logger.info("streaming_complete", tokens=tokens_used, model=model)

        except Exception as exc:
            logger.error("streaming_error", error=str(exc))
            yield self._sse_event({"error": str(exc), "done": True})