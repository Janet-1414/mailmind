"""
database/connection.py — async PostgreSQL engine via asyncpg + SQLAlchemy.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

settings = get_settings()


class DatabaseConnection:
    """Manages the async SQLAlchemy engine and session factory."""

    def __init__(self, database_url: str) -> None:
        self._engine: AsyncEngine = create_async_engine(
            database_url,
            echo=False,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
        )
        self._session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
            bind=self._engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

    @property
    def engine(self) -> AsyncEngine:
        return self._engine

    async def close(self) -> None:
        await self._engine.dispose()

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """FastAPI dependency that yields a database session."""
        async with self._session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise


# Module-level singleton used by FastAPI's Depends()
db_connection = DatabaseConnection(settings.database_url)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency shortcut."""
    async for session in db_connection.get_session():
        yield session
