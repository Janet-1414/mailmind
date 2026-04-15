import hashlib
import json
import logging
from typing import Optional

import redis

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

CACHE_TTL_SECONDS = 3600  # 1 hour


class CacheService:
    """Redis-backed cache for LLM reply responses."""

    def __init__(self, redis_url: str):
        self._client: Optional[redis.Redis] = None
        self._redis_url = redis_url
        self._connect()

    def _connect(self) -> None:
        try:
            self._client = redis.from_url(self._redis_url, decode_responses=True)
            self._client.ping()
            logger.info("Redis cache connected.")
        except Exception as exc:
            logger.warning(f"Redis unavailable — caching disabled. Reason: {exc}")
            self._client = None

    def _build_key(self, email_content: str, tone: str, model: str, hint: str = "") -> str:
        raw = f"{email_content.strip().lower()}|{tone}|{model}|{hint.strip().lower()}"
        return "mailmind:reply:" + hashlib.sha256(raw.encode()).hexdigest()

    def get(self, email_content: str, tone: str, model: str, hint: str = "") -> Optional[dict]:
        if not self._client:
            return None
        try:
            data = self._client.get(self._build_key(email_content, tone, model, hint))
            return json.loads(data) if data else None
        except Exception as exc:
            logger.warning(f"Cache get failed: {exc}")
            return None

    def set(self, email_content: str, tone: str, model: str, payload: dict, hint: str = "") -> None:
        if not self._client:
            return
        try:
            key = self._build_key(email_content, tone, model, hint)
            self._client.setex(key, CACHE_TTL_SECONDS, json.dumps(payload))
        except Exception as exc:
            logger.warning(f"Cache set failed: {exc}")

    def invalidate(self, email_content: str, tone: str, model: str, hint: str = "") -> None:
        if not self._client:
            return
        try:
            self._client.delete(self._build_key(email_content, tone, model, hint))
            logger.info("Cache invalidated for key.")
        except Exception as exc:
            logger.warning(f"Cache invalidate failed: {exc}")

    @property
    def is_available(self) -> bool:
        return self._client is not None


# Singleton
cache_service = CacheService(settings.REDIS_URL)
