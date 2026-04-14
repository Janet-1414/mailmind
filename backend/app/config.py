"""
config.py — centralised settings loaded from environment variables.
Uses pydantic-settings so every value is validated at startup.
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """All application configuration in one place."""

    # ── Application ──────────────────────────────────────────────
    secret_key: str = Field(..., env="SECRET_KEY")
    algorithm: str = Field("HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    frontend_url: str = Field("http://localhost:3000", env="FRONTEND_URL")

    # ── Database ─────────────────────────────────────────────────
    database_url: str = Field(..., env="DATABASE_URL")

    # ── Redis ────────────────────────────────────────────────────
    redis_url: str = Field("redis://localhost:6379", env="REDIS_URL")

    # ── OpenAI ───────────────────────────────────────────────────
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")

    # ── Anthropic ────────────────────────────────────────────────
    anthropic_api_key: str = Field(..., env="ANTHROPIC_API_KEY")

    # ── Pinecone ─────────────────────────────────────────────────
    pinecone_api_key: str = Field(..., env="PINECONE_API_KEY")
    pinecone_index_name: str = Field("mailmind", env="PINECONE_INDEX_NAME")

    # ── Tavily ───────────────────────────────────────────────────
    tavily_api_key: str = Field("", env="TAVILY_API_KEY")

    # ── LangSmith ────────────────────────────────────────────────
    langchain_tracing_v2: str = Field("false", env="LANGCHAIN_TRACING_V2")
    langchain_api_key: str = Field("", env="LANGCHAIN_API_KEY")
    langchain_project: str = Field("mailmind-capstone", env="LANGCHAIN_PROJECT")

    # ── Gmail OAuth2 ─────────────────────────────────────────────
    google_client_id: str = Field("", env="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field("", env="GOOGLE_CLIENT_SECRET")
    google_redirect_uri: str = Field(
        "http://localhost:8000/email/gmail/callback", env="GOOGLE_REDIRECT_URI"
    )

    # ── Microsoft / Outlook OAuth2 ───────────────────────────────
    microsoft_client_id: str = Field("", env="MICROSOFT_CLIENT_ID")
    microsoft_client_secret: str = Field("", env="MICROSOFT_CLIENT_SECRET")
    microsoft_redirect_uri: str = Field(
        "http://localhost:8000/email/outlook/callback", env="MICROSOFT_REDIRECT_URI"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    def configure_langsmith(self) -> None:
        """Set LangSmith env vars so LangChain picks them up automatically."""
        os.environ["LANGCHAIN_TRACING_V2"] = self.langchain_tracing_v2
        os.environ["LANGCHAIN_API_KEY"] = self.langchain_api_key
        os.environ["LANGCHAIN_PROJECT"] = self.langchain_project


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton of Settings."""
    return Settings()
