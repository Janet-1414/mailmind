"""
tests/test_auth.py — authentication endpoint tests.
"""

import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    resp = await client.post(
        "/auth/register",
        json={"email": "new@example.com", "password": "SecurePass1!", "full_name": "New User"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "new@example.com"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client, test_user):
    resp = await client.post(
        "/auth/register",
        json={"email": test_user.email, "password": "SecurePass1!", "full_name": "Dup"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client, test_user):
    resp = await client.post(
        "/auth/login",
        data={"username": test_user.email, "password": "TestPass123!"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client, test_user):
    resp = await client.post(
        "/auth/login",
        data={"username": test_user.email, "password": "WrongPass!"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(client, auth_headers):
    resp = await client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert "email" in resp.json()


@pytest.mark.asyncio
async def test_me_unauthenticated(client):
    resp = await client.get("/auth/me")
    assert resp.status_code == 401
