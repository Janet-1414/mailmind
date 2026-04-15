"""
Pinecone vector memory service for MailMind.
Handles storing interaction summaries as vector embeddings using
OpenAI text-embedding-3-small (1536 dimensions), retrieving the most
semantically relevant past contexts per user using per-user namespacing,
deleting individual items, and pruning old memories beyond the configured
retention limit.
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from openai import OpenAI
from pinecone import Pinecone
from sqlalchemy.orm import Session

from app.config import settings
from app.memory.models import MemoryLog

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-3-small"
TOP_K           = 5
SCORE_THRESHOLD = 0.75


class MemoryService:
    """Pinecone-backed long-term memory with per-user namespacing and pruning."""

    def __init__(self):
        self._openai  = OpenAI(api_key=settings.OPENAI_API_KEY)
        self._pc      = None
        self._index   = None

    def _get_index(self):
        if self._index is None:
            self._pc    = Pinecone(api_key=settings.PINECONE_API_KEY)
            self._index = self._pc.Index(settings.PINECONE_INDEX_NAME)
        return self._index

    def _embed(self, text: str) -> List[float]:
        response = self._openai.embeddings.create(
            input=text,
            model=EMBEDDING_MODEL,
        )
        return response.data[0].embedding

    def store(self, user_id: str, content: str, namespace: Optional[str] = None) -> Optional[str]:
        """Store a memory embedding in Pinecone with per-user namespace."""
        try:
            vector    = self._embed(content)
            vector_id = f"{user_id}-{datetime.now(timezone.utc).timestamp()}"
            ns        = namespace or f"user-{user_id}"
            self._get_index().upsert(
                vectors=[{"id": vector_id, "values": vector, "metadata": {"content": content, "user_id": user_id}}],
                namespace=ns,
            )
            return vector_id
        except Exception as exc:
            logger.warning("Memory store failed: %s", exc)
            return None

    def retrieve(self, user_id: str, query: str, namespace: Optional[str] = None, top_k: int = TOP_K) -> List[str]:
        """Retrieve top-k semantically relevant memories for the user."""
        try:
            ns           = namespace or f"user-{user_id}"
            query_vector = self._embed(query)
            results      = self._get_index().query(
                vector=query_vector,
                top_k=top_k,
                namespace=ns,
                include_metadata=True,
                filter={"user_id": {"$eq": user_id}},
            )
            return [
                match.metadata["content"]
                for match in results.matches
                if match.score >= SCORE_THRESHOLD
            ]
        except Exception as exc:
            logger.warning("Memory retrieval failed: %s", exc)
            return []

    def delete(self, vector_id: str, user_id: str, namespace: Optional[str] = None) -> bool:
        """Delete a single memory by vector ID."""
        try:
            ns = namespace or f"user-{user_id}"
            self._get_index().delete(ids=[vector_id], namespace=ns)
            return True
        except Exception as exc:
            logger.warning("Memory delete failed: %s", exc)
            return False

    def delete_all(self, user_id: str, namespace: Optional[str] = None) -> bool:
        """Delete all memories for a user from Pinecone."""
        try:
            ns = namespace or f"user-{user_id}"
            self._get_index().delete(delete_all=True, namespace=ns)
            return True
        except Exception as exc:
            logger.warning("Memory delete_all failed: %s", exc)
            return False

    def prune_old_memories(self, db: Session, user_id: str, namespace: Optional[str] = None) -> int:
        """Remove memories older than MEMORY_PRUNE_DAYS or beyond MEMORY_MAX_ITEMS.
        Returns the number of items pruned."""
        pruned  = 0
        ns      = namespace or f"user-{user_id}"
        cutoff  = datetime.now(timezone.utc) - timedelta(days=settings.MEMORY_PRUNE_DAYS)

        old_logs = (
            db.query(MemoryLog)
            .filter(MemoryLog.user_id == user_id, MemoryLog.created_at < cutoff)
            .all()
        )
        for log in old_logs:
            self.delete(log.pinecone_id, user_id, ns)
            db.delete(log)
            pruned += 1

        # Also prune beyond MAX_ITEMS (keep most recent)
        all_logs = (
            db.query(MemoryLog)
            .filter(MemoryLog.user_id == user_id)
            .order_by(MemoryLog.created_at.desc())
            .all()
        )
        if len(all_logs) > settings.MEMORY_MAX_ITEMS:
            excess = all_logs[settings.MEMORY_MAX_ITEMS:]
            for log in excess:
                self.delete(log.pinecone_id, user_id, ns)
                db.delete(log)
                pruned += 1

        if pruned:
            db.commit()
            logger.info("Pruned %d memories for user %s", pruned, user_id)

        return pruned


memory_service = MemoryService()
