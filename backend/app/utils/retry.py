import asyncio
import logging
from functools import wraps
from typing import Callable, Tuple, Type

logger = logging.getLogger(__name__)


class RetryHandler:
    """Configurable retry logic with exponential backoff for async functions."""

    def __init__(
        self,
        max_attempts: int = 3,
        initial_delay: float = 1.0,
        backoff_factor: float = 2.0,
        exceptions: Tuple[Type[Exception], ...] = (Exception,),
    ):
        self.max_attempts = max_attempts
        self.initial_delay = initial_delay
        self.backoff_factor = backoff_factor
        self.exceptions = exceptions

    def __call__(self, func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            delay = self.initial_delay
            for attempt in range(1, self.max_attempts + 1):
                try:
                    return await func(*args, **kwargs)
                except self.exceptions as exc:
                    if attempt == self.max_attempts:
                        logger.error(
                            f"{func.__name__} failed after {self.max_attempts} attempts: {exc}"
                        )
                        raise
                    logger.warning(
                        f"{func.__name__} attempt {attempt}/{self.max_attempts} "
                        f"failed: {exc}. Retrying in {delay:.1f}s…"
                    )
                    await asyncio.sleep(delay)
                    delay *= self.backoff_factor

        return wrapper


# Pre-configured decorators for common use
retry_llm    = RetryHandler(max_attempts=3, initial_delay=1.0, backoff_factor=2.0)
retry_quick  = RetryHandler(max_attempts=2, initial_delay=0.5, backoff_factor=2.0)
