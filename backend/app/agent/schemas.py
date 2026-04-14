"""
agent/schemas.py — ReplyRequest and ReplyResponse with validation + sanitisation.
"""

import re
import uuid
from typing import Any

from pydantic import ConfigDict, BaseModel, Field, field_validator


def _sanitise(text: str) -> str:
    """Remove common prompt-injection patterns."""
    patterns = [
        r"ignore (all )?previous instructions",
        r"you are now",
        r"disregard (your|all) (previous |prior )?(instructions|rules|guidelines)",
        r"act as (a |an )?(?!professional|assistant)",
        r"jailbreak",
        r"<\|.*?\|>",          # token boundary tricks
        r"\[INST\].*?\[/INST\]",
    ]
    cleaned = text
    for p in patterns:
        cleaned = re.sub(p, "", cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


class ReplyRequest(BaseModel):
    """Validated input for the /agent/reply endpoint."""

    email_content: str = Field(..., min_length=1, max_length=10000)
    hint: str = Field("", max_length=500)
    tone: str = Field("professional", max_length=50)
    model: str = Field("gpt-4o-mini", max_length=100)
    thread_id: uuid.UUID | None = None
    web_search_enabled: bool = False

    @field_validator("email_content")
    @classmethod
    def sanitise_email(cls, v: str) -> str:
        return _sanitise(v)

    @field_validator("hint")
    @classmethod
    def sanitise_hint(cls, v: str) -> str:
        return _sanitise(v)

    @field_validator("tone")
    @classmethod
    def validate_tone(cls, v: str) -> str:
        allowed = {
            "professional", "friendly", "formal", "casual",
            "empathetic", "assertive", "concise",
        }
        if v.lower() not in allowed:
            return "professional"
        return v.lower()

    @field_validator("model")
    @classmethod
    def validate_model(cls, v: str) -> str:
        allowed = {
            "gpt-4o", "gpt-4o-mini", "gpt-4-turbo",
            "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307",
        }
        if v not in allowed:
            return "gpt-4o-mini"
        return v


class ReplyResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    """Response from the /agent/reply endpoint."""

    reply: str
    confidence_score: int
    confidence_breakdown: dict[str, int]
    tokens_used: int
    model_used: str
    email_analysis: dict[str, Any]
    thread_id: uuid.UUID | None
    email_log_id: uuid.UUID | None
