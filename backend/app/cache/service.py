"""
cache/service.py — Redis cache with 24-hour default TTL.
"""

import json
from typing import Any

import redis.asyncio as aioredis

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

DEFAULT_TTL = 86400  # 24 hours in seconds


class CacheService:
    """Async Redis cache wrapper."""

    def __init__(self) -> None:
        self._client: aioredis.Redis | None = None

    async def connect(self) -> None:
        self._client = aioredis.from_url(
            settings.redis_url, encoding="utf-8", decode_responses=True
        )
        logger.info("redis_connected")

    async def disconnect(self) -> None:
        if self._client:
            await self._client.aclose()

    def _ensure_connected(self) -> aioredis.Redis:
        if not self._client:
            raise RuntimeError("CacheService not connected — call connect() first")
        return self._client

    async def get(self, key: str) -> Any | None:
        client = self._ensure_connected()
        raw = await client.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return raw

    async def set(self, key: str, value: Any, ttl: int = DEFAULT_TTL) -> None:
        client = self._ensure_connected()
        await client.set(key, json.dumps(value), ex=ttl)

    async def delete(self, key: str) -> None:
        client = self._ensure_connected()
        await client.delete(key)

    async def exists(self, key: str) -> bool:
        client = self._ensure_connected()
        return bool(await client.exists(key))

    async def increment(self, key: str, ttl: int = 3600) -> int:
        client = self._ensure_connected()
        count = await client.incr(key)
        if count == 1:
            await client.expire(key, ttl)
        return count


# Module-level singleton
cache = CacheService()
