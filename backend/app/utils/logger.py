"""
utils/logger.py — structured logging with correlation IDs using structlog.
"""

import time
import uuid
from contextvars import ContextVar
from typing import Any

import structlog
from structlog.types import EventDict, WrappedLogger

# Context variable so correlation ID flows through async tasks
_correlation_id: ContextVar[str] = ContextVar("correlation_id", default="")


def get_correlation_id() -> str:
    return _correlation_id.get() or "no-correlation-id"


def set_correlation_id(cid: str) -> None:
    _correlation_id.set(cid)


def generate_correlation_id() -> str:
    cid = str(uuid.uuid4())
    set_correlation_id(cid)
    return cid


def _add_correlation_id(
    logger: WrappedLogger, method: str, event_dict: EventDict
) -> EventDict:
    event_dict["correlation_id"] = get_correlation_id()
    return event_dict


def _add_timestamp(
    logger: WrappedLogger, method: str, event_dict: EventDict
) -> EventDict:
    event_dict["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    return event_dict


structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        _add_timestamp,
        _add_correlation_id,
        structlog.dev.ConsoleRenderer(colors=True),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(20),  # INFO level
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)


class AppLogger:
    """Thin wrapper around structlog for consistent usage across the app."""

    def __init__(self, name: str) -> None:
        self._logger = structlog.get_logger(name)

    def info(self, event: str, **kwargs: Any) -> None:
        self._logger.info(event, **kwargs)

    def warning(self, event: str, **kwargs: Any) -> None:
        self._logger.warning(event, **kwargs)

    def error(self, event: str, **kwargs: Any) -> None:
        self._logger.error(event, **kwargs)

    def debug(self, event: str, **kwargs: Any) -> None:
        self._logger.debug(event, **kwargs)

    def bind(self, **kwargs: Any) -> "AppLogger":
        bound = AppLogger.__new__(AppLogger)
        bound._logger = self._logger.bind(**kwargs)
        return bound


def get_logger(name: str) -> AppLogger:
    return AppLogger(name)
