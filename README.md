# MailMind Capstone

AI-powered email reply agent — production-grade capstone built with Next.js 15, FastAPI, LangGraph, PostgreSQL, Pinecone, and Redis.

## Features

- ✦ Conditional LangGraph routing (skips nodes adaptively)
- 🔒 Input validation + prompt injection sanitisation
- ⏱ LLM call timeouts (30s OpenAI + Anthropic)
- 🔍 EmailAnalyzerTool integrated into agent pipeline
- 📜 Conversation history truncation (last 10 exchanges + token guard)
- 🔭 LangSmith tracing + structured correlation-ID logging
- 🗄 PostgreSQL via asyncpg + Alembic migrations
- 📦 UV dependency management with pinned versions
- 🧠 Per-user Pinecone namespacing (no cross-user contamination)
- 🌿 Automatic memory pruning (90 days / 0.6 score threshold)
- ⚡ Streaming replies via SSE (token by token, like ChatGPT)
- 🎯 Reply confidence scoring (0–100, with breakdown)
- 📄 Email templates (save, search, one-click load)
- 🚦 Per-user rate limiting (20 req/hour via slowapi)
- 📬 Gmail + Outlook OAuth2 inbox integration
- 🌙 Dark / light mode

---

## Quick Start

### Prerequisites
- Docker Desktop (running)
- Node.js 18+
- Python 3.11+
- UV (`pip install uv`)

### 1 — Clone & configure

```bash
git clone <repo>
cd mailmind-capstone
```

Copy the env file and fill in your API keys:
```bash
cp backend/.env.example backend/.env
```

Minimum required keys:
```
SECRET_KEY=any-random-string
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PINECONE_API_KEY=...
```

### 2 — Start Docker services

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 and Redis on port 6379.

### 3 — Backend setup

```bash
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000
```

### 4 — Frontend setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

---

## API Docs

Once the backend is running: http://localhost:8000/docs

---

## Gmail Setup (Free)

1. Go to https://console.cloud.google.com
2. Create a new project → Enable Gmail API
3. OAuth consent screen → External → Add your email as test user
4. Credentials → OAuth 2.0 Client ID → Web application
5. Add redirect URI: `http://localhost:8000/email/gmail/callback`
6. Copy Client ID and Secret into `.env`

## Outlook Setup (Free)

1. Go to https://portal.azure.com
2. Azure Active Directory → App registrations → New registration
3. Redirect URI: `http://localhost:8000/email/outlook/callback`
4. Certificates & secrets → New client secret
5. API permissions → Microsoft Graph → Mail.Read + Mail.Send
6. Copy Application ID and Secret into `.env`

---

## Running Tests

```bash
cd backend
uv run pytest tests/ -v
```

---

## Architecture

```
Frontend (Next.js 15)
    ↓ REST + SSE
Backend (FastAPI)
    ↓ LangGraph (conditional routing)
    ├── analyze  →  EmailAnalyzerTool
    ├── retrieve →  Pinecone (per-user namespace)
    ├── web_search → Tavily (conditional)
    ├── draft    →  OpenAI / Anthropic (30s timeout)
    ├── refine   →  OpenAI / Anthropic
    └── score    →  Confidence 0–100
    ↓
PostgreSQL (users, threads, memory, templates, feedback)
Redis (cache, 24hr TTL)
APScheduler (daily memory pruning)
LangSmith (agent tracing)
```

## Colour Palette

| Name       | Hex       |
|------------|-----------|
| Deep Olive | `#41431B` |
| Sage Green | `#AEB784` |
| Warm Sand  | `#E3DBBB` |
| Cream      | `#F8F3E1` |
