"""
Pydantic request and response schemas for the agent endpoint.
Defines ReplyRequest with input validation (max_length) and ReplyResponse
including the generated reply, token usage, cost, cache status, thread ID,
confidence score, and sources used.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Any


class AgentSettings(BaseModel):
    model:             str   = "gpt-4o-mini"
    tone:              str   = "formal"
    temperature:       float = Field(0.7, ge=0.0, le=2.0)
    top_p:             float = Field(1.0, ge=0.0, le=1.0)
    frequency_penalty: float = Field(0.0, ge=-2.0, le=2.0)
    web_search_enabled: bool = False


class ConversationTurn(BaseModel):
    email_content: str
    reply:         str


class ReplyRequest(BaseModel):
    email_content: str              = Field(..., min_length=1, max_length=10000)
    hint:          str              = Field("", max_length=500)
    thread_id:     Optional[str]    = None
    settings:      AgentSettings    = AgentSettings()
    conversation_history: List[ConversationTurn] = []


class TokenUsage(BaseModel):
    prompt_tokens:     int
    completion_tokens: int
    total_tokens:      int
    cost_usd:          float


class ReplyResponse(BaseModel):
    email_log_id:     str
    thread_id:        str
    reply:            str
    usage:            TokenUsage
    cached:           bool
    sources:          List[str]
    memory_used:      bool
    confidence_score: Optional[float] = None
