"""
main.py — FastAPI application entry point with lifespan, routers, and middleware.
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.agent.router import router as agent_router
from app.auth.router import router as auth_router
from app.cache.service import cache
from app.config import get_settings
from app.database.connection import db_connection
from app.email_integration.router import router as email_router
from app.feedback.router import router as feedback_router
from app.memory.pruning import MemoryPruner
from app.memory.router import router as memory_router
from app.templates.router import router as templates_router
from app.threads.router import router as threads_router
from app.utils.logger import generate_correlation_id, get_logger, set_correlation_id
from app.utils.rate_limiter import limiter

settings = get_settings()
settings.configure_langsmith()
logger = get_logger(__name__)

_pruner: MemoryPruner | None = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup and shutdown lifecycle."""
    global _pruner

    # Startup
    logger.info("mailmind_starting")
    await cache.connect()

    _pruner = MemoryPruner(db_connection._session_factory)
    _pruner.start()
    logger.info("mailmind_ready")

    yield

    # Shutdown
    logger.info("mailmind_shutting_down")
    if _pruner:
        _pruner.shutdown()
    await cache.disconnect()
    await db_connection.close()
    logger.info("mailmind_stopped")


def create_app() -> FastAPI:
    app = FastAPI(
        title="MailMind Capstone API",
        version="1.0.0",
        description="AI-powered email reply agent — production-grade capstone.",
        lifespan=lifespan,
    )

    # ── Rate limiting ────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # ── CORS ─────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url, "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Correlation ID middleware ─────────────────────────────────
    @app.middleware("http")
    async def correlation_id_middleware(request: Request, call_next):
        cid = request.headers.get("X-Correlation-ID") or generate_correlation_id()
        set_correlation_id(cid)
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = cid
        return response

    # ── Routers ──────────────────────────────────────────────────
    app.include_router(auth_router)
    app.include_router(agent_router)
    app.include_router(memory_router)
    app.include_router(templates_router)
    app.include_router(threads_router)
    app.include_router(feedback_router)
    app.include_router(email_router)

    @app.get("/health")
    async def health() -> dict:
        return {"status": "ok", "version": "1.0.0"}

    return app


app = create_app()
