# MailMind ✉ — AI Email Reply Agent (Capstone)

## Overview

MailMind is a full-stack AI-powered email assistant that reads any email you paste, understands its intent and urgency, retrieves relevant context from your past interactions, and drafts a reply that sounds like you — in seconds. It learns your communication style over time and improves with every interaction.

---

## What's new in Capstone

- **Conditional routing** — LangGraph now skips the web_search node dynamically when disabled
- **Confidence score** — each reply includes a 0–100% quality score
- **LLM timeouts** — 30s timeout on all OpenAI and Anthropic API calls
- **Input validation** — max 10,000 chars for email, 500 chars for hint
- **EmailAnalyzerTool** — structural pre-analysis (urgency, questions, topics) before LLM call
- **Memory pruning** — auto-removes memories older than 90 days or beyond 100 items
- **Per-user Pinecone namespacing** — complete memory isolation between users
- **History truncation** — only last 10 exchanges passed to agent (prevents context overflow)
- **Rate limiting** — 20 req/min per IP on agent endpoint, 10/min on auth
- **LangSmith observability** — optional tracing for agent debugging
- **Alembic migrations** — proper PostgreSQL migration management
- **UV project management** — replaces pip + requirements.txt
- **Dark/light theme** — toggle in navbar, persisted to localStorage
- **Midnight Slate color palette** — new professional design system
- **Streaming responses** — word-by-word reply display (falls back to JSON if unavailable)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, Tailwind CSS, TypeScript, next-themes |
| Backend | FastAPI, Python 3.10+ |
| AI Agent | LangGraph (conditional routing) |
| Vector Memory | Pinecone (per-user namespacing) |
| Cache | Redis |
| Database | SQLite (local) / PostgreSQL (production) |
| Migrations | Alembic |
| LLMs | OpenAI, Anthropic |
| Web Search | Tavily |
| Observability | LangSmith |
| Rate Limiting | SlowAPI |
| Dependency Mgmt | UV |

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- UV — install with `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Redis
- API keys for OpenAI and Pinecone (minimum)

### Step 1 — Clone

```bash
git clone https://github.com/Janet-1414/mailmind.git
cd mailmind
```

### Step 2 — Backend setup with UV

```bash
cd backend
cp .env.example .env
# Fill in your API keys in .env

uv sync                              # installs all dependencies
uv run alembic upgrade head          # runs database migrations
uv run uvicorn app.main:app --reload # starts the server
```

Backend runs at `http://localhost:8000`

### Step 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

### Step 4 — Pinecone Index

1. Go to pinecone.io → Create Index
2. Name: `mailmind`, Dimensions: `1536`, Metric: `cosine`

### Running Tests

```bash
cd backend
uv run pytest
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | JWT signing secret |
| `DATABASE_URL` | Yes | SQLite or PostgreSQL URL |
| `OPENAI_API_KEY` | Yes | OpenAI key |
| `ANTHROPIC_API_KEY` | No | Enables Claude models |
| `PINECONE_API_KEY` | Yes | Pinecone key |
| `PINECONE_INDEX_NAME` | Yes | Must be `mailmind` |
| `REDIS_URL` | Yes | Redis connection |
| `TAVILY_API_KEY` | No | Web search |
| `LANGCHAIN_TRACING_V2` | No | Set to `true` to enable LangSmith |
| `LANGCHAIN_API_KEY` | No | LangSmith API key |
| `RATE_LIMIT_PER_MINUTE` | No | Default 20 |
| `MEMORY_MAX_ITEMS` | No | Default 100 |
| `MEMORY_PRUNE_DAYS` | No | Default 90 |
| `MAX_HISTORY_EXCHANGES` | No | Default 10 |
| `FRONTEND_URL` | No | For CORS in production |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Current user |
| PATCH | `/auth/me` | Update profile |
| POST | `/auth/change-password` | Change password |
| DELETE | `/auth/me` | Delete account |
| POST | `/agent/reply` | Generate reply |
| GET | `/threads` | List threads |
| GET | `/threads/{id}` | Get thread |
| PATCH | `/threads/{id}/title` | Rename thread |
| DELETE | `/threads/{id}` | Delete thread |
| GET | `/memory` | List memories |
| DELETE | `/memory/{id}` | Delete memory |
| DELETE | `/memory` | Clear all memory |
| POST | `/memory/prune` | Manual prune |
| POST | `/feedback` | Submit feedback |
| GET | `/health` | Health check |

---

## Known Limitations

- SQLite for local dev — use PostgreSQL on Railway for production
- No email OAuth yet (Gmail/Outlook) — replies are drafted from pasted text
- Streaming endpoint is prepared in frontend but requires SSE backend implementation
- Pinecone free tier limited to 1 index

---

## Deployment

**Frontend → Vercel**
```bash
# Set NEXT_PUBLIC_API_URL to your Railway backend URL
npx vercel --prod
```

**Backend + DB + Redis → Railway**
- Connect GitHub repo to Railway
- Add PostgreSQL and Redis services
- Set all environment variables
- Railway auto-deploys on every push to main
