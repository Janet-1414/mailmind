"""Tests for the MailMind LangGraph agent pipeline.
Covers initial state, all nodes including conditional routing,
confidence scoring, and the EmailAnalyzerTool integration.
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from app.agent.graph import MailMindAgent


@pytest.fixture
def base_state():
    return MailMindAgent.build_initial_state(
        email_content="Hi, can you send me the project update?",
        tone="formal",
        model="gpt-4o-mini",
        temperature=0.7,
        top_p=1.0,
        frequency_penalty=0.0,
        web_search_enabled=False,
        user_id="test-user-123",
        hint="",
        conversation_history=[],
    )


@pytest.fixture
def web_search_state():
    return MailMindAgent.build_initial_state(
        email_content="What are the latest AI trends?",
        tone="friendly",
        model="gpt-4o-mini",
        temperature=0.7,
        top_p=1.0,
        frequency_penalty=0.0,
        web_search_enabled=True,
        user_id="test-user-123",
        hint="",
        conversation_history=[],
    )


def test_build_initial_state(base_state):
    assert base_state["email_content"] == "Hi, can you send me the project update?"
    assert base_state["tone"] == "formal"
    assert base_state["model"] == "gpt-4o-mini"
    assert base_state["draft_reply"] == ""
    assert base_state["hint"] == ""
    assert base_state["conversation_history"] == []
    assert base_state["confidence_score"] == 0.0
    assert base_state["web_search_enabled"] is False


@pytest.mark.asyncio
async def test_analyze_node(base_state):
    mock_usage = MagicMock(prompt_tokens=10, completion_tokens=20)
    with patch("app.agent.nodes.AgentNodes._call_llm", new_callable=AsyncMock,
               return_value=('{"intent": "request", "sentiment": "neutral", "urgency": "medium", "key_points": ["update"]}', mock_usage)):
        from app.agent.nodes import AgentNodes
        nodes = AgentNodes()
        result = await nodes.analyze(base_state)
        assert isinstance(result, dict)
        assert result["intent"] == "request"
        assert result["sentiment"] == "neutral"
        assert result["urgency"] == "medium"


@pytest.mark.asyncio
async def test_analyze_node_bad_json(base_state):
    mock_usage = MagicMock(prompt_tokens=10, completion_tokens=20)
    with patch("app.agent.nodes.AgentNodes._call_llm", new_callable=AsyncMock,
               return_value=("not valid json", mock_usage)):
        from app.agent.nodes import AgentNodes
        nodes = AgentNodes()
        result = await nodes.analyze(base_state)
        assert isinstance(result, dict)
        assert result["intent"] == "general inquiry"


@pytest.mark.asyncio
async def test_retrieve_node(base_state):
    with patch("app.memory.service.memory_service.retrieve", return_value=["past context"]):
        from app.agent.nodes import AgentNodes
        nodes = AgentNodes()
        result = await nodes.retrieve(base_state)
        assert "retrieved_context" in result
        assert result["memory_used"] is True


@pytest.mark.asyncio
async def test_web_search_disabled(base_state):
    from app.agent.nodes import AgentNodes
    nodes = AgentNodes()
    result = await nodes.web_search(base_state)
    assert result.get("search_results", "") == ""


@pytest.mark.asyncio
async def test_web_search_enabled(web_search_state):
    with patch("app.agent.nodes.search_web", new_callable=AsyncMock,
               return_value="Latest AI trends include..."):
        from app.agent.nodes import AgentNodes
        nodes = AgentNodes()
        result = await nodes.web_search(web_search_state)
        assert result.get("search_results") == "Latest AI trends include..."


def test_conditional_routing_web_search_disabled(base_state):
    from app.agent.graph import _should_web_search
    assert _should_web_search(base_state) == "draft"


def test_conditional_routing_web_search_enabled(web_search_state):
    from app.agent.graph import _should_web_search
    assert _should_web_search(web_search_state) == "web_search"


@pytest.mark.asyncio
async def test_score_node(base_state):
    state = {**base_state, "final_reply": "Here is the project update."}
    mock_usage = MagicMock(prompt_tokens=10, completion_tokens=5)
    with patch("app.agent.nodes.AgentNodes._call_llm", new_callable=AsyncMock,
               return_value=("0.85", mock_usage)):
        from app.agent.nodes import AgentNodes
        nodes = AgentNodes()
        result = await nodes.score(state)
        assert result["confidence_score"] == 0.85


@pytest.mark.asyncio
async def test_full_agent_run(base_state):
    mock_usage = MagicMock(prompt_tokens=100, completion_tokens=50)
    with patch("app.agent.nodes.AgentNodes._call_llm", new_callable=AsyncMock,
               return_value=("Here is the project update reply.", mock_usage)):
        from app.agent.nodes import AgentNodes
        nodes = AgentNodes()
        state = base_state.copy()
        state = {**state, **await nodes.analyze(state)}
        state = {**state, **await nodes.retrieve(state)}
        state = {**state, **await nodes.web_search(state)}
        state = {**state, **await nodes.draft(state)}
        state = {**state, **await nodes.refine(state)}
        state = {**state, **await nodes.score(state)}
        assert state.get("draft_reply", "") != ""
        assert state.get("final_reply", "") != ""
