"""
tests/conftest.py — shared pytest fixtures.
"""

import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.database.base import Base
from app.database.connection import get_db
from app.auth.models import User
from app.auth.service import AuthService

TEST_DB_URL = "postgresql+asyncpg://mailmind:mailmind_secret@localhost:5432/mailmind_test"


@pytest_asyncio.fixture(scope="session")
async def engine():
    eng = create_async_engine(TEST_DB_URL, echo=False)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session):
    service = AuthService(db_session)
    from app.auth.schemas import UserRegisterRequest
    user = await service.register(
        UserRegisterRequest(
            email=f"test_{uuid.uuid4().hex[:6]}@example.com",
            password="TestPass123!",
            full_name="Test User",
        )
    )
    await db_session.commit()
    return user


@pytest_asyncio.fixture
async def auth_headers(client, test_user):
    resp = await client.post(
        "/auth/login",
        data={"username": test_user.email, "password": "TestPass123!"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
