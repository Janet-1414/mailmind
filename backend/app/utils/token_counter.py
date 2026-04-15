from dataclasses import dataclass, field

# Pricing per 1K tokens in USD
MODEL_PRICING: dict[str, dict[str, float]] = {
    "gpt-4o":                    {"input": 0.005000, "output": 0.015000},
    "gpt-4o-mini":               {"input": 0.000150, "output": 0.000600},
    "gpt-3.5-turbo":             {"input": 0.000500, "output": 0.001500},
    "claude-3-5-haiku-20241022": {"input": 0.000250, "output": 0.001250},
}


@dataclass
class TokenCounter:
    """Accumulates token usage and calculates cost across multiple LLM calls."""

    model: str
    prompt_tokens: int = field(default=0)
    completion_tokens: int = field(default=0)

    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens

    @property
    def cost_usd(self) -> float:
        pricing = MODEL_PRICING.get(self.model, {"input": 0.001, "output": 0.002})
        cost = (
            self.prompt_tokens / 1000 * pricing["input"]
            + self.completion_tokens / 1000 * pricing["output"]
        )
        return round(cost, 6)

    def add(self, usage: object) -> None:
        """Accept a usage object from OpenAI or Anthropic and accumulate counts."""
        prompt = getattr(usage, "prompt_tokens", 0) or getattr(usage, "input_tokens", 0)
        completion = getattr(usage, "completion_tokens", 0) or getattr(usage, "output_tokens", 0)
        self.prompt_tokens += prompt
        self.completion_tokens += completion

    def to_dict(self) -> dict:
        return {
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "cost_usd": self.cost_usd,
        }
