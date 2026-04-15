"""
MailMind FastAPI application entry point.
Initialises the app, registers all routers, configures CORS, LangSmith
observability, and manages the database lifecycle via the lifespan context.
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.connection import create_tables
from app.auth.router import router as auth_router
from app.agent.router import router as agent_router
from app.memory.router import router as memory_router
from app.feedback.router import router as feedback_router
from app.threads.router import router as threads_router
from app.utils.rate_limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── LangSmith tracing ─────────────────────────────────────────────────────────
if settings.LANGCHAIN_TRACING_V2 == "true" and settings.LANGCHAIN_API_KEY:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"]    = settings.LANGCHAIN_API_KEY
    os.environ["LANGCHAIN_PROJECT"]    = settings.LANGCHAIN_PROJECT
    logger.info("LangSmith tracing enabled — project: %s", settings.LANGCHAIN_PROJECT)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("MailMind starting up…")
    create_tables()
    logger.info("Database tables verified.")
    yield
    logger.info("MailMind shutting down.")


app = FastAPI(
    title="MailMind API",
    version="2.0.0",
    description="AI-powered email reply agent with LangGraph, Pinecone RAG, and Redis caching.",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", os.getenv("FRONTEND_URL", "")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,     prefix="/auth",     tags=["auth"])
app.include_router(agent_router,    prefix="/agent",    tags=["agent"])
app.include_router(memory_router,   prefix="/memory",   tags=["memory"])
app.include_router(feedback_router, prefix="/feedback", tags=["feedback"])
app.include_router(threads_router,  prefix="/threads",  tags=["threads"])


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
