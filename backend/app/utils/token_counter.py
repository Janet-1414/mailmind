"""
utils/token_counter.py — token counting and cost estimation using tiktoken.
"""

from typing import Any
import tiktoken

from app.utils.logger import get_logger

logger = get_logger(__name__)

# Cost per 1k tokens in USD (approximate, update as needed)
COST_TABLE: dict[str, dict[str, float]] = {
    "gpt-4o": {"input": 0.005, "output": 0.015},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "claude-3-5-sonnet-20241022": {"input": 0.003, "output": 0.015},
    "claude-3-haiku-20240307": {"input": 0.00025, "output": 0.00125},
}

MAX_TOKENS_MAP: dict[str, int] = {
    "gpt-4o": 128000,
    "gpt-4o-mini": 128000,
    "gpt-4-turbo": 128000,
    "claude-3-5-sonnet-20241022": 200000,
    "claude-3-haiku-20240307": 200000,
}


class TokenCounter:
    """Counts tokens and estimates LLM costs."""

    def __init__(self, model: str = "gpt-4o") -> None:
        self._model = model
        try:
            self._encoding = tiktoken.encoding_for_model(model)
        except KeyError:
            self._encoding = tiktoken.get_encoding("cl100k_base")

    def count(self, text: str) -> int:
        """Return the number of tokens in *text*."""
        return len(self._encoding.encode(text))

    def count_messages(self, messages: list[dict[str, Any]]) -> int:
        """Count tokens across a list of chat messages."""
        total = 0
        for msg in messages:
            content = msg.get("content", "")
            if isinstance(content, str):
                total += self.count(content)
            total += 4  # per-message overhead
        return total

    def fits_in_context(self, text: str, reserve: int = 2000) -> bool:
        """Return True if *text* fits within the model's context window."""
        max_tokens = MAX_TOKENS_MAP.get(self._model, 8192)
        return self.count(text) <= (max_tokens - reserve)

    def estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Return estimated USD cost for an API call."""
        costs = COST_TABLE.get(self._model, {"input": 0.01, "output": 0.03})
        return (input_tokens * costs["input"] + output_tokens * costs["output"]) / 1000

    def truncate_history(
        self,
        history: list[dict[str, Any]],
        max_exchanges: int = 10,
        max_tokens: int = 6000,
    ) -> list[dict[str, Any]]:
        """
        Truncate conversation history to the last *max_exchanges* exchanges
        and ensure total tokens stay under *max_tokens*.
        """
        truncated = history[-max_exchanges:]
        while truncated and self.count_messages(truncated) > max_tokens:
            truncated = truncated[1:]
        return truncated
