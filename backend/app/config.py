"""
Environment configuration for MailMind.
Loads all settings from the .env file using Pydantic BaseSettings.
Covers database, auth, LLM providers, Pinecone, Redis, Tavily,
rate limiting, and LangSmith observability configuration.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    # App 
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    # Database 
    DATABASE_URL: str = "sqlite:///./mailmind.db"

    # OpenAI 
    OPENAI_API_KEY: str = ""
    OPENAI_TIMEOUT: float = 30.0

    # Anthropic
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_TIMEOUT: float = 30.0

    # Pinecone 
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "mailmind"

    # Redis 
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600

    # Tavily 
    TAVILY_API_KEY: str = ""

    # LangSmith Observability 
    LANGCHAIN_TRACING_V2: str = "false"
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "mailmind"

    # Rate Limiting 
    RATE_LIMIT_PER_MINUTE: int = 20

    # Memory Pruning 
    MEMORY_MAX_ITEMS: int = 100
    MEMORY_PRUNE_DAYS: int = 90

    # Conversation History 
    MAX_HISTORY_EXCHANGES: int = 10

    model_config = ConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
