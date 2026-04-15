import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.base import Base, get_db

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    from app.auth.models import User
    from app.memory.models import EmailLog
    from app.feedback.models import Feedback
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


def test_register_success(client):
    res = client.post("/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_register_duplicate_email(client):
    payload = {"name": "User", "email": "dupe@example.com", "password": "pass1234"}
    client.post("/auth/register", json=payload)
    res = client.post("/auth/register", json=payload)
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"]


def test_login_success(client):
    client.post("/auth/register", json={
        "name": "Login User",
        "email": "login@example.com",
        "password": "password123"
    })
    res = client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "password123"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "name": "User",
        "email": "wrong@example.com",
        "password": "correct"
    })
    res = client.post("/auth/login", json={
        "email": "wrong@example.com",
        "password": "incorrect"
    })
    assert res.status_code == 401


def test_get_me(client):
    client.post("/auth/register", json={
        "name": "Me User",
        "email": "me@example.com",
        "password": "password123"
    })
    login_res = client.post("/auth/login", json={
        "email": "me@example.com",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "me@example.com"


def test_get_me_no_token(client):
    res = client.get("/auth/me")
    assert res.status_code == 401
