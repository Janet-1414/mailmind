"""
utils/rate_limiter.py — per-user rate limiting with slowapi.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address


def _get_user_identifier(request: object) -> str:  # type: ignore[type-arg]
    """
    Use the JWT subject (user_id) as the rate-limit key when available,
    falling back to the remote IP address.
    """
    from fastapi import Request

    if isinstance(request, Request):
        user = getattr(request.state, "user", None)
        if user and hasattr(user, "id"):
            return str(user.id)
    return get_remote_address(request)  # type: ignore[arg-type]


# Singleton limiter — imported by routers
limiter = Limiter(key_func=_get_user_identifier, default_limits=["200/hour"])
