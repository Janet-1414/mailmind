"""
LangGraph agent state definition for MailMind.
Defines the AgentState TypedDict that flows through every node in the
pipeline — holding the email content, tone, model settings, hint,
conversation history, retrieved context, draft reply, token usage,
cost, confidence score, and source attribution.
"""
from typing import TypedDict, List, Any


class AgentState(TypedDict):
    # ── Input ─────────────────────────────────────────────────────────────────
    email_content:       str
    tone:                str
    model:               str
    temperature:         float
    top_p:               float
    frequency_penalty:   float
    web_search_enabled:  bool
    user_id:             str
    hint:                str
    conversation_history: List[Any]

    # ── Pipeline state ────────────────────────────────────────────────────────
    analysis:            str
    intent:              str
    sentiment:           str
    urgency:             str
    retrieved_context:   List[str]
    search_results:      str
    draft_reply:         str
    final_reply:         str
    memory_used:         bool
    sources:             List[str]
    confidence_score:    float

    # ── Token tracking ────────────────────────────────────────────────────────
    prompt_tokens:       int
    completion_tokens:   int
    total_tokens:        int
    cost_usd:            float
