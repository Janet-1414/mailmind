"""
tests/test_memory.py — memory endpoint tests.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock


@pytest.mark.asyncio
async def test_list_memories_empty(client, auth_headers):
    with patch("app.memory.service.MemoryService.list_all", new_callable=AsyncMock, return_value=[]):
        resp = await client.get("/memory/", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_memory_health(client, auth_headers):
    health_data = {
        "total_memories": 10,
        "healthy": 8,
        "pruned_eligible": 2,
        "average_score": 0.85,
        "health_percentage": 80.0,
    }
    with patch("app.memory.service.MemoryService.get_health", new_callable=AsyncMock, return_value=health_data):
        resp = await client.get("/memory/health", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_memories"] == 10
    assert data["health_percentage"] == 80.0


@pytest.mark.asyncio
async def test_email_analyzer_urgency():
    from app.tools.email_analyzer import EmailAnalyzerTool
    analyzer = EmailAnalyzerTool()
    result = analyzer.analyze("This is URGENT! Please respond ASAP to this critical issue.")
    assert result.is_urgent is True
    assert result.urgency_level in ("medium", "high")


@pytest.mark.asyncio
async def test_email_analyzer_questions():
    from app.tools.email_analyzer import EmailAnalyzerTool
    analyzer = EmailAnalyzerTool()
    result = analyzer.analyze("Can you help me? What time works for you? Are you available?")
    assert result.question_count >= 2


@pytest.mark.asyncio
async def test_email_analyzer_sentiment():
    from app.tools.email_analyzer import EmailAnalyzerTool
    analyzer = EmailAnalyzerTool()
    result = analyzer.analyze("I am very disappointed and frustrated with this terrible service.")
    assert result.sentiment_hint in ("negative", "frustrated")
