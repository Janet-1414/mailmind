"""
tools/web_search.py — Tavily web search wrapper.
"""

from tavily import TavilyClient

from app.config import get_settings
from app.utils.logger import get_logger
from app.utils.retry import async_retry

logger = get_logger(__name__)
settings = get_settings()


class WebSearchTool:
    """Wraps Tavily search with retry logic."""

    def __init__(self) -> None:
        self._client = TavilyClient(api_key=settings.tavily_api_key)

    @async_retry(max_attempts=2, base_delay=1.0)
    async def search(self, query: str, max_results: int = 3) -> list[dict]:
        """
        Perform a web search and return a list of result dicts.
        Each dict contains: title, url, content.
        """
        import asyncio

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self._client.search(query, max_results=max_results),
        )
        results = []
        for item in response.get("results", []):
            results.append(
                {
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "content": item.get("content", "")[:500],
                }
            )
        logger.info("web_search_complete", query=query, results=len(results))
        return results
