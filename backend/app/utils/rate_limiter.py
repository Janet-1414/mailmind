"""
Rate limiting utility for MailMind using SlowAPI.
Provides a shared limiter instance used across all routers to protect
expensive endpoints like agent reply generation and authentication from abuse.
Default limit is configurable via RATE_LIMIT_PER_MINUTE in settings.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.config import settings

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
)
