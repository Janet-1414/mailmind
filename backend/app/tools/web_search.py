"""
Tavily web search tool for the MailMind agent.
Wraps the Tavily search API to fetch current information from the web
when the user enables web search. Results are injected into the draft
prompt to allow the agent to reference up-to-date facts in its reply.
"""
import logging
from typing import List

from app.config import get_settings

logger   = logging.getLogger(__name__)
settings = get_settings()


class WebSearchTool:
    """Searches the web using the Tavily API to enrich email replies."""

    def __init__(self, api_key: str):
        self._api_key = api_key
        self._client  = None
        if api_key:
            try:
                from tavily import TavilyClient
                self._client = TavilyClient(api_key=api_key)
            except ImportError:
                logger.warning("tavily-python not installed. Web search disabled.")

    async def search(self, query: str, max_results: int = 3) -> List[str]:
        """Returns a list of relevant text snippets for the query."""
        if not self._client:
            return []
        try:
            response = self._client.search(query=query, max_results=max_results)
            return [r.get("content", "") for r in response.get("results", []) if r.get("content")]
        except Exception as exc:
            logger.warning("Web search failed for query '%s': %s", query, exc)
            return []


web_search_tool = WebSearchTool(settings.TAVILY_API_KEY)


async def search_web(query: str) -> str:
    """Convenience wrapper — returns joined search results as a single string."""
    results = await web_search_tool.search(query)
    return "\n\n".join(results) if results else ""