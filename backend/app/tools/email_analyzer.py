"""
Email analysis tool for the MailMind agent.
Provides structured pre-LLM analysis of email content — urgency detection,
question detection, read-time estimation, and word count.
Results are passed into the analyze node to enrich the LLM prompt.
"""
import re
from dataclasses import dataclass
from typing import List


@dataclass
class EmailAnalysis:
    word_count:       int
    estimated_read_time_seconds: int
    has_questions:    bool
    question_count:   int
    urgency_signals:  List[str]
    is_urgent:        bool
    detected_topics:  List[str]


URGENCY_KEYWORDS = [
    "urgent", "asap", "immediately", "critical", "emergency",
    "deadline", "today", "right away", "as soon as possible",
    "time-sensitive", "priority", "important",
]

TOPIC_KEYWORDS = {
    "meeting":     ["meeting", "call", "schedule", "calendar", "appointment"],
    "payment":     ["invoice", "payment", "billing", "cost", "price", "quote"],
    "follow-up":   ["follow up", "following up", "update", "status", "progress"],
    "complaint":   ["issue", "problem", "concern", "disappointed", "unsatisfied"],
    "request":     ["please", "could you", "would you", "can you", "requesting"],
    "collaboration": ["collaborate", "partnership", "together", "work with"],
}


def analyze_email(email_content: str) -> EmailAnalysis:
    """Perform structural analysis on raw email text before LLM processing."""
    text_lower = email_content.lower()
    words = email_content.split()
    word_count = len(words)
    read_time = max(1, word_count // 200 * 60)

    sentences = re.split(r"[.!?]+", email_content)
    questions = [s for s in sentences if "?" in s]

    urgency_found = [kw for kw in URGENCY_KEYWORDS if kw in text_lower]
    is_urgent = len(urgency_found) > 0

    topics = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            topics.append(topic)

    return EmailAnalysis(
        word_count=word_count,
        estimated_read_time_seconds=read_time,
        has_questions=len(questions) > 0,
        question_count=len(questions),
        urgency_signals=urgency_found,
        is_urgent=is_urgent,
        detected_topics=topics,
    )


def format_analysis_for_prompt(analysis: EmailAnalysis) -> str:
    """Format the structural analysis as a string for injection into LLM prompts."""
    parts = []
    if analysis.is_urgent:
        parts.append(f"⚠ URGENT — signals detected: {', '.join(analysis.urgency_signals)}")
    if analysis.has_questions:
        parts.append(f"Contains {analysis.question_count} question(s) that should be addressed")
    if analysis.detected_topics:
        parts.append(f"Topics detected: {', '.join(analysis.detected_topics)}")
    parts.append(f"Email length: {analysis.word_count} words")
    return "\n".join(parts) if parts else "Standard email — no special signals detected."
