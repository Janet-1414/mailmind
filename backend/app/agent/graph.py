"""
LangGraph agent graph definition for MailMind.
Builds and compiles the stateful agent pipeline with conditional routing:
  analyze → retrieve → [web_search? → draft] → refine → score
Web search is skipped via conditional edge when web_search_enabled is False,
saving latency and API calls on every standard request.
"""
import logging
from langgraph.graph import StateGraph, END
from app.agent.state import AgentState
from app.agent.nodes import AgentNodes
from app.config import settings

logger = logging.getLogger(__name__)


def _should_web_search(state: AgentState) -> str:
    """Conditional edge: route to web_search or skip directly to draft."""
    return "web_search" if state.get("web_search_enabled") else "draft"


class MailMindAgent:
    """Compiled LangGraph agent for email reply generation."""

    def __init__(self):
        self._nodes = AgentNodes()
        self._graph = self._build()

    def _build(self):
        graph = StateGraph(AgentState)

        graph.add_node("analyze",    self._nodes.analyze)
        graph.add_node("retrieve",   self._nodes.retrieve)
        graph.add_node("web_search", self._nodes.web_search)
        graph.add_node("draft",      self._nodes.draft)
        graph.add_node("refine",     self._nodes.refine)
        graph.add_node("score",      self._nodes.score)

        graph.set_entry_point("analyze")
        graph.add_edge("analyze", "retrieve")

        # Conditional edge — skip web_search when disabled
        graph.add_conditional_edges(
            "retrieve",
            _should_web_search,
            {
                "web_search": "web_search",
                "draft":      "draft",
            },
        )

        graph.add_edge("web_search", "draft")
        graph.add_edge("draft",      "refine")
        graph.add_edge("refine",     "score")
        graph.add_edge("score",      END)

        return graph.compile()

    async def run(self, initial_state: AgentState) -> AgentState:
        """Execute the full agent pipeline and return the final state."""
        logger.info("Agent starting for user %s", initial_state.get("user_id"))
        result = await self._graph.ainvoke(initial_state)
        logger.info("Agent complete — confidence: %s", result.get("confidence_score"))
        return result

    @staticmethod
    def build_initial_state(
        email_content: str,
        tone: str,
        model: str,
        temperature: float,
        top_p: float,
        frequency_penalty: float,
        web_search_enabled: bool,
        user_id: str,
        hint: str = "",
        conversation_history: list = [],
    ) -> AgentState:
        return AgentState(
            email_content=email_content,
            tone=tone,
            model=model,
            temperature=temperature,
            top_p=top_p,
            frequency_penalty=frequency_penalty,
            web_search_enabled=web_search_enabled,
            user_id=user_id,
            hint=hint,
            conversation_history=conversation_history,
            analysis="",
            intent="",
            sentiment="",
            urgency="",
            key_points=[],
            retrieved_context=[],
            search_results="",
            draft_reply="",
            final_reply="",
            memory_used=False,
            sources=[],
            confidence_score=0.0,
            prompt_tokens=0,
            completion_tokens=0,
            total_tokens=0,
            cost_usd=0.0,
        )


mailmind_agent = MailMindAgent()
