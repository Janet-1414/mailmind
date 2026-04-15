"""Tests for the MailMind memory service.
Covers storing, retrieving, deleting, clearing, and pruning memories
with per-user namespace support.
"""
import pytest
from unittest.mock import patch, MagicMock
from tests.conftest import client, db_session


def test_list_memory_empty(client):
    response = client.get("/memory", headers={"Authorization": "Bearer testtoken"})
    assert response.status_code in (200, 401)


def test_list_memory_authenticated(client):
    login = client.post("/auth/login", json={"email": "memory@test.com", "password": "testpass123"})
    if login.status_code != 200:
        reg = client.post("/auth/register", json={"name": "Memory Test", "email": "memory@test.com", "password": "testpass123"})
        assert reg.status_code == 200
        token = reg.json()["access_token"]
    else:
        token = login.json()["access_token"]
    response = client.get("/memory", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_clear_all_memory(client):
    login = client.post("/auth/login", json={"email": "memory@test.com", "password": "testpass123"})
    if login.status_code != 200:
        reg = client.post("/auth/register", json={"name": "Memory Test", "email": "memory@test.com", "password": "testpass123"})
        token = reg.json()["access_token"]
    else:
        token = login.json()["access_token"]
    with patch("app.memory.service.memory_service.delete_all", return_value=True):
        response = client.delete("/memory", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["success"] is True


def test_prune_memory_endpoint(client):
    login = client.post("/auth/login", json={"email": "memory@test.com", "password": "testpass123"})
    if login.status_code != 200:
        reg = client.post("/auth/register", json={"name": "Memory Test", "email": "memory@test.com", "password": "testpass123"})
        token = reg.json()["access_token"]
    else:
        token = login.json()["access_token"]
    with patch("app.memory.service.memory_service.prune_old_memories", return_value=3):
        response = client.post("/memory/prune", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["pruned"] == 3


def test_memory_service_store():
    with patch("app.memory.service.MemoryService._get_index") as mock_index, \
         patch("app.memory.service.MemoryService._embed", return_value=[0.1] * 1536):
        mock_index.return_value.upsert = MagicMock()
        from app.memory.service import MemoryService
        svc = MemoryService()
        result = svc.store("user-123", "test content", namespace="user-user-123")
        assert result is not None


def test_memory_service_retrieve():
    with patch("app.memory.service.MemoryService._get_index") as mock_index, \
         patch("app.memory.service.MemoryService._embed", return_value=[0.1] * 1536):
        mock_match = MagicMock()
        mock_match.score = 0.9
        mock_match.metadata = {"content": "past email context"}
        mock_index.return_value.query.return_value.matches = [mock_match]
        from app.memory.service import MemoryService
        svc = MemoryService()
        results = svc.retrieve("user-123", "project update", namespace="user-user-123")
        assert results == ["past email context"]


def test_memory_namespace_isolation():
    """Verify that per-user namespacing keeps memories isolated."""
    with patch("app.memory.service.MemoryService._get_index") as mock_index, \
         patch("app.memory.service.MemoryService._embed", return_value=[0.1] * 1536):
        mock_index.return_value.upsert = MagicMock()
        from app.memory.service import MemoryService
        svc = MemoryService()
        svc.store("user-abc", "content for user abc", namespace="user-user-abc")
        call_kwargs = mock_index.return_value.upsert.call_args
        assert call_kwargs[1]["namespace"] == "user-user-abc"
