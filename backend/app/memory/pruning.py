"""
memory/pruning.py — background memory pruning with APScheduler.
Runs daily: deletes memories older than 90 days OR below 0.6 relevance score.
"""

from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import get_settings
from app.memory.models import MemoryLog
from app.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

PRUNE_DAYS = 90
RELEVANCE_THRESHOLD = 0.6


class MemoryPruner:
    """Schedules and executes automatic memory pruning."""

    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory
        self._scheduler = AsyncIOScheduler()

    def start(self) -> None:
        """Register the daily pruning job and start the scheduler."""
        self._scheduler.add_job(
            self._prune,
            trigger="interval",
            hours=24,
            id="memory_pruner",
            replace_existing=True,
            next_run_time=datetime.now(timezone.utc),  # run once on startup too
        )
        self._scheduler.start()
        logger.info("memory_pruner_started")

    def shutdown(self) -> None:
        self._scheduler.shutdown(wait=False)
        logger.info("memory_pruner_stopped")

    async def _prune(self) -> None:
        """Delete stale and low-relevance memories from DB (Pinecone handled separately)."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=PRUNE_DAYS)
        async with self._session_factory() as session:
            # Fetch candidates first so we can remove from Pinecone too
            result = await session.execute(
                select(MemoryLog).where(
                    (MemoryLog.created_at < cutoff)
                    | (MemoryLog.relevance_score < RELEVANCE_THRESHOLD)
                )
            )
            stale = result.scalars().all()

            if not stale:
                logger.info("memory_pruner_nothing_to_prune")
                return

            # Delete from Pinecone per user namespace
            from pinecone import Pinecone

            pc = Pinecone(api_key=settings.pinecone_api_key)
            index = pc.Index(settings.pinecone_index_name)

            namespace_map: dict[str, list[str]] = {}
            for mem in stale:
                ns = f"user_{mem.user_id}"
                namespace_map.setdefault(ns, []).append(mem.pinecone_id)

            for ns, ids in namespace_map.items():
                index.delete(ids=ids, namespace=ns)

            # Delete from DB
            ids_to_delete = [m.id for m in stale]
            await session.execute(
                delete(MemoryLog).where(MemoryLog.id.in_(ids_to_delete))
            )
            await session.commit()
            logger.info("memory_pruner_complete", pruned=len(stale))
