"""
tools/email_analyzer.py — pre-LLM structured email analysis.
Detects urgency, questions, sentiment, and estimates read time.
"""

import re
from dataclasses import dataclass, field


@dataclass
class EmailAnalysis:
    """Structured result of pre-LLM email analysis."""

    is_urgent: bool = False
    urgency_level: str = "low"  # low | medium | high
    questions: list[str] = field(default_factory=list)
    question_count: int = 0
    estimated_read_time_seconds: int = 0
    word_count: int = 0
    sentiment_hint: str = "neutral"  # positive | neutral | negative | frustrated
    requires_action: bool = False
    action_keywords: list[str] = field(default_factory=list)
    summary_hint: str = ""


_URGENT_KEYWORDS = [
    "urgent", "asap", "immediately", "emergency", "critical",
    "deadline", "right away", "as soon as possible", "priority",
    "time-sensitive", "overdue",
]

_NEGATIVE_KEYWORDS = [
    "disappointed", "frustrated", "unhappy", "angry", "terrible",
    "unacceptable", "worst", "complaint", "problem", "issue", "broken",
]

_POSITIVE_KEYWORDS = [
    "thank", "appreciate", "great", "excellent", "wonderful",
    "pleased", "happy", "love", "amazing",
]

_ACTION_KEYWORDS = [
    "please", "can you", "could you", "would you", "need you to",
    "require", "confirm", "approve", "review", "send", "provide",
    "update", "schedule", "call", "meet",
]


class EmailAnalyzerTool:
    """
    Analyses email content before calling the LLM.
    Provides structured metadata to guide prompt construction.
    """

    def analyze(self, email_content: str) -> EmailAnalysis:
        """Return an EmailAnalysis for the given email text."""
        text_lower = email_content.lower()
        words = email_content.split()
        word_count = len(words)

        # ── Urgency ───────────────────────────────────────────────
        urgency_matches = [kw for kw in _URGENT_KEYWORDS if kw in text_lower]
        is_urgent = bool(urgency_matches)
        if len(urgency_matches) >= 3:
            urgency_level = "high"
        elif urgency_matches:
            urgency_level = "medium"
        else:
            urgency_level = "low"

        # ── Questions ─────────────────────────────────────────────
        sentences = re.split(r"[.!?]+", email_content)
        questions = [s.strip() for s in sentences if "?" in s and s.strip()]

        # ── Read time (avg 200 wpm) ───────────────────────────────
        read_seconds = max(1, round(word_count / 200 * 60))

        # ── Sentiment ─────────────────────────────────────────────
        neg_score = sum(1 for kw in _NEGATIVE_KEYWORDS if kw in text_lower)
        pos_score = sum(1 for kw in _POSITIVE_KEYWORDS if kw in text_lower)
        if neg_score >= 2:
            sentiment = "frustrated"
        elif neg_score > pos_score:
            sentiment = "negative"
        elif pos_score > neg_score:
            sentiment = "positive"
        else:
            sentiment = "neutral"

        # ── Action required ───────────────────────────────────────
        action_found = [kw for kw in _ACTION_KEYWORDS if kw in text_lower]
        requires_action = bool(action_found)

        # ── Summary hint (first 120 chars) ────────────────────────
        summary_hint = email_content[:120].strip().replace("\n", " ")

        return EmailAnalysis(
            is_urgent=is_urgent,
            urgency_level=urgency_level,
            questions=questions,
            question_count=len(questions),
            estimated_read_time_seconds=read_seconds,
            word_count=word_count,
            sentiment_hint=sentiment,
            requires_action=requires_action,
            action_keywords=action_found,
            summary_hint=summary_hint,
        )
