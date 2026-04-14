"""
agent/state.py — LangGraph AgentState definition.
"""

from typing import Any, TypedDict


class AgentState(TypedDict, total=False):
    """Shared state passed between all LangGraph nodes."""

    # Input
    email_content: str
    hint: str
    tone: str
    model: str
    thread_id: str
    user_id: str
    web_search_enabled: bool
    history: list[dict[str, Any]]

    # Analysis (from EmailAnalyzerTool)
    email_analysis: dict[str, Any]

    # Retrieved context
    memories: list[dict[str, Any]]
    web_results: list[dict[str, Any]]

    # Generated output
    draft_reply: str
    final_reply: str
    confidence_score: int
    confidence_breakdown: dict[str, int]

    # Token tracking
    total_tokens: int
    model_used: str

    # Error handling
    error: str | None
    pinecone_available: bool
