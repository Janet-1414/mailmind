"""
agent/graph.py — conditional LangGraph pipeline with adaptive routing.
"""

from langgraph.graph import END, START, StateGraph

from app.agent.nodes import AgentNodes
from app.agent.state import AgentState
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _should_web_search(state: AgentState) -> str:
    """Skip web_search node when disabled or Tavily key is missing."""
    from app.config import get_settings
    settings = get_settings()
    if state.get("web_search_enabled", False) and settings.tavily_api_key:
        return "web_search"
    return "draft"


def _should_retrieve(state: AgentState) -> str:
    """Skip retrieve node when Pinecone is known to be unavailable."""
    if state.get("pinecone_available", True):
        return "retrieve"
    return "draft"


class AgentGraph:
    """Builds and compiles the conditional LangGraph workflow."""

    def __init__(self) -> None:
        self._nodes = AgentNodes()
        self._graph = self._build()

    def _build(self) -> StateGraph:
        builder = StateGraph(AgentState)

        # Register all nodes
        builder.add_node("analyze", self._nodes.analyze)
        builder.add_node("retrieve", self._nodes.retrieve)
        builder.add_node("web_search", self._nodes.web_search)
        builder.add_node("draft", self._nodes.draft)
        builder.add_node("refine", self._nodes.refine)
        builder.add_node("score_confidence", self._nodes.score_confidence)

        # Entry: always analyze first
        builder.add_edge(START, "analyze")

        # After analyze: conditionally retrieve
        builder.add_conditional_edges(
            "analyze",
            _should_retrieve,
            {"retrieve": "retrieve", "draft": "draft"},
        )

        # After retrieve: conditionally web search
        builder.add_conditional_edges(
            "retrieve",
            _should_web_search,
            {"web_search": "web_search", "draft": "draft"},
        )

        # After web_search: always draft
        builder.add_edge("web_search", "draft")

        # Linear tail: draft → refine → score → END
        builder.add_edge("draft", "refine")
        builder.add_edge("refine", "score_confidence")
        builder.add_edge("score_confidence", END)

        return builder.compile()

    async def run(self, initial_state: AgentState) -> AgentState:
        """Execute the graph and return the final state."""
        logger.info("graph_run_start", user_id=initial_state.get("user_id"))
        result = await self._graph.ainvoke(initial_state)
        logger.info(
            "graph_run_complete",
            confidence=result.get("confidence_score"),
            tokens=result.get("total_tokens"),
        )
        return result


# Module-level singleton so the graph is compiled once
agent_graph = AgentGraph()
