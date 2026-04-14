"""
tests/test_streaming.py — SSE streaming endpoint tests.
"""

import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_stream_endpoint_requires_auth(client):
    resp = await client.post(
        "/agent/reply/stream",
        json={"email_content": "Hello"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_stream_content_type(client, auth_headers):
    """Stream endpoint should return text/event-stream content type."""
    async def fake_stream(*args, **kwargs):
        yield 'data: {"token": "Hello", "done": false}\n\n'
        yield 'data: {"token": " world", "done": false}\n\n'
        yield 'data: {"token": "", "done": true, "full_reply": "Hello world", "tokens_used": 10, "model_used": "gpt-4o-mini"}\n\n'

    with patch(
        "app.agent.streaming.StreamingHandler.stream_reply",
        side_effect=fake_stream,
    ):
        with patch("app.memory.service.MemoryService.retrieve", new_callable=AsyncMock, return_value=[]):
            resp = await client.post(
                "/agent/reply/stream",
                json={"email_content": "Please help me respond to this."},
                headers=auth_headers,
            )
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers.get("content-type", "")


def test_streaming_handler_sse_format():
    import json
    from app.agent.streaming import StreamingHandler
    handler = StreamingHandler()
    event = handler._sse_event({"token": "hi", "done": False})
    assert event.startswith("data: ")
    assert event.endswith("\n\n")
    parsed = json.loads(event[6:])
    assert parsed["token"] == "hi"
