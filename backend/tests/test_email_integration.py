"""
tests/test_email_integration.py — email integration endpoint tests.
"""

import pytest
from unittest.mock import patch, MagicMock


@pytest.mark.asyncio
async def test_gmail_auth_url(client, auth_headers):
    with patch(
        "app.email_integration.gmail.GmailService.get_auth_url",
        return_value="https://accounts.google.com/o/oauth2/auth?...",
    ):
        resp = await client.get("/email/gmail/auth", headers=auth_headers)
    assert resp.status_code == 200
    assert "auth_url" in resp.json()


@pytest.mark.asyncio
async def test_outlook_auth_url(client, auth_headers):
    with patch(
        "app.email_integration.outlook.OutlookService.get_auth_url",
        return_value="https://login.microsoftonline.com/...",
    ):
        resp = await client.get("/email/outlook/auth", headers=auth_headers)
    assert resp.status_code == 200
    assert "auth_url" in resp.json()


@pytest.mark.asyncio
async def test_gmail_inbox_not_connected(client, auth_headers):
    """Should return 400 when Gmail not connected."""
    resp = await client.get("/email/gmail/inbox", headers=auth_headers)
    assert resp.status_code == 400
    assert "not connected" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_outlook_inbox_not_connected(client, auth_headers):
    resp = await client.get("/email/outlook/inbox", headers=auth_headers)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_send_invalid_provider(client, auth_headers):
    resp = await client.post(
        "/email/send",
        json={"to": "test@example.com", "subject": "Hi", "body": "Hello", "provider": "yahoo"},
        headers=auth_headers,
    )
    assert resp.status_code == 400
