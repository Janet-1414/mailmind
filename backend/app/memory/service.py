"""
memory/service.py — Pinecone vector store with per-user namespace isolation.
"""

import uuid
from datetime import datetime, timezone

from openai import AsyncOpenAI
from pinecone import Pinecone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.memory.models import MemoryLog
from app.utils.logger import get_logger
from app.utils.retry import async_retry

logger = get_logger(__name__)
settings = get_settings()

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536
RELEVANCE_THRESHOLD = 0.6
PRUNE_DAYS = 90


class MemoryService:
    """Handles storage and retrieval of user memories in Pinecone."""

    def __init__(self, db: AsyncSession, user_id: uuid.UUID) -> None:
        self._db = db
        self._user_id = user_id
        self._namespace = f"user_{user_id}"
        self._openai = AsyncOpenAI(api_key=settings.openai_api_key, timeout=30.0)
        self._pc = Pinecone(api_key=settings.pinecone_api_key)
        self._index = self._pc.Index(settings.pinecone_index_name)

    # ── Embedding ────────────────────────────────────────────────

    @async_retry(max_attempts=3, base_delay=1.0)
    async def _embed(self, text: str) -> list[float]:
        response = await self._openai.embeddings.create(
            model=EMBEDDING_MODEL, input=text
        )
        return response.data[0].embedding

    # ── Store ────────────────────────────────────────────────────

    async def store(self, content: str) -> MemoryLog:
        """Embed *content* and upsert into Pinecone under the user namespace."""
        vector = await self._embed(content)
        pinecone_id = str(uuid.uuid4())

        self._index.upsert(
            vectors=[{"id": pinecone_id, "values": vector, "metadata": {"content": content}}],
            namespace=self._namespace,
        )

        log = MemoryLog(
            user_id=self._user_id,
            pinecone_id=pinecone_id,
            content=content,
            relevance_score=1.0,
        )
        self._db.add(log)
        await self._db.flush()
        logger.info("memory_stored", user_id=str(self._user_id), pinecone_id=pinecone_id)
        return log

    # ── Retrieve ─────────────────────────────────────────────────

    async def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        """Return top-k relevant memories for *query*."""
        vector = await self._embed(query)
        results = self._index.query(
            vector=vector,
            top_k=top_k,
            namespace=self._namespace,
            include_metadata=True,
        )
        memories = []
        for match in results.matches:
            if match.score >= RELEVANCE_THRESHOLD:
                memories.append(
                    {"content": match.metadata.get("content", ""), "score": match.score}
                )
                await self._update_last_accessed(match.id)
        return memories

    async def _update_last_accessed(self, pinecone_id: str) -> None:
        result = await self._db.execute(
            select(MemoryLog).where(MemoryLog.pinecone_id == pinecone_id)
        )
        log = result.scalar_one_or_none()
        if log:
            log.last_accessed = datetime.now(timezone.utc)

    # ── List & Delete ────────────────────────────────────────────

    async def list_all(self) -> list[MemoryLog]:
        result = await self._db.execute(
            select(MemoryLog)
            .where(MemoryLog.user_id == self._user_id)
            .order_by(MemoryLog.created_at.desc())
        )
        return list(result.scalars().all())

    async def delete(self, memory_id: uuid.UUID) -> bool:
        result = await self._db.execute(
            select(MemoryLog).where(
                MemoryLog.id == memory_id,
                MemoryLog.user_id == self._user_id,
            )
        )
        log = result.scalar_one_or_none()
        if not log:
            return False
        self._index.delete(ids=[log.pinecone_id], namespace=self._namespace)
        await self._db.delete(log)
        return True

    # ── Health ───────────────────────────────────────────────────

    async def get_health(self) -> dict:
        memories = await self.list_all()
        total = len(memories)
        if total == 0:
            return {
                "total_memories": 0,
                "healthy": 0,
                "pruned_eligible": 0,
                "average_score": 0.0,
                "health_percentage": 100.0,
            }
        healthy = [m for m in memories if m.relevance_score >= RELEVANCE_THRESHOLD]
        avg = sum(m.relevance_score for m in memories) / total
        return {
            "total_memories": total,
            "healthy": len(healthy),
            "pruned_eligible": total - len(healthy),
            "average_score": round(avg, 3),
            "health_percentage": round(len(healthy) / total * 100, 1),
        }
