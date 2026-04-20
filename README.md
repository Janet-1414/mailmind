# MailMind ✉ — AI Email Reply Agent

## Overview

MailMind is a full-stack AI-powered email assistant that reads any email you paste, understands its intent, urgency, and context, retrieves relevant information from your past interactions, and drafts a reply that sounds like you — in seconds. It learns your communication style over time and improves with every interaction through long-term vector memory.

The system is built around a LangGraph agent pipeline that runs multiple specialised steps before generating a reply, giving it significantly better context awareness than a simple prompt-response approach.

---

## What it does

- Reads and understands any email — extracting intent, sentiment, urgency, and key topics before drafting
- Drafts a personalised reply using a five-node LangGraph pipeline with conditional routing
- Accepts a reply hint to guide the agent in a specific direction before generation
- Remembers your communication style across sessions using Pinecone vector memory
- Learns from feedback — thumbs down with a comment triggers an automatic retry with the correction injected into the prompt
- Streams replies word by word using Server-Sent Events so you see the reply as it is being written
- Organises conversations into threads with full chat history that persists across sessions
- Supports multiple LLMs — GPT-4o, GPT-4o-mini, GPT-3.5-turbo, Claude 3.5 Haiku
- Caches replies with Redis to avoid redundant API calls on identical requests
- Optionally searches the web via Tavily for emails that need current information
- Scores each reply with a confidence percentage so you know how well it addressed the email
- Rate limits requests to prevent API cost abuse
- Supports light and dark themes with a toggle in the navigation bar

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, Tailwind CSS, TypeScript, next-themes |
| Backend | FastAPI, Python 3.10+ |
| AI Agent | LangGraph with conditional routing |
| Vector Memory | Pinecone with per-user namespacing |
| Cache | Redis |
| Database | SQLite (local) / PostgreSQL (production) |
| Database Migrations | Alembic |
| LLMs | OpenAI GPT-4o / GPT-4o-mini / GPT-3.5-turbo, Anthropic Claude 3.5 Haiku |
| Web Search | Tavily |
| Observability | LangSmith |
| Rate Limiting | SlowAPI |
| Dependency Management | UV with pyproject.toml |

---

## Project Structure

```
mailmind/
├── backend/
│   ├── pyproject.toml               # UV dependency management
│   ├── alembic.ini                  # Alembic configuration
│   ├── alembic/
│   │   ├── env.py                   # Migration environment
│   │   └── versions/
│   │       ├── 0001_initial_tables.py
│   │       └── 0002_add_confidence_score.py
│   ├── app/
│   │   ├── main.py                  # App entry point, router registration
│   │   ├── config.py                # Environment settings via Pydantic
│   │   ├── agent/
│   │   │   ├── graph.py             # LangGraph pipeline with conditional routing
│   │   │   ├── nodes.py             # Pipeline nodes: analyze, retrieve, web_search, draft, refine, score
│   │   │   ├── prompts.py           # LLM prompt templates
│   │   │   ├── router.py            # POST /agent/reply endpoint
│   │   │   ├── streaming.py         # POST /agent/reply/stream SSE endpoint
│   │   │   ├── schemas.py           # Request/response validation
│   │   │   └── state.py             # LangGraph AgentState TypedDict
│   │   ├── auth/                    # JWT authentication
│   │   ├── memory/                  # Pinecone vector memory + MemoryLog DB model
│   │   ├── feedback/                # User feedback storage + cache invalidation
│   │   ├── threads/                 # Conversation thread management
│   │   ├── cache/                   # Redis caching service
│   │   ├── tools/
│   │   │   ├── email_analyzer.py    # Structural email analysis tool
│   │   │   └── web_search.py        # Tavily web search tool
│   │   ├── database/                # SQLAlchemy engine + session
│   │   └── utils/
│   │       ├── token_counter.py     # Token usage and cost calculation
│   │       ├── retry.py             # Exponential backoff decorator
│   │       └── rate_limiter.py      # SlowAPI rate limiter
│   └── tests/
│       ├── test_agent.py
│       ├── test_auth.py
│       └── test_memory.py
│
└── frontend/
    └── src/
        ├── app/                     # Next.js pages
        │   ├── page.tsx             # Landing page
        │   ├── dashboard/           # Main app interface
        │   ├── memory/              # Memory management page
        │   ├── settings/            # Account settings
        │   ├── login/
        │   └── register/
        ├── components/
        │   ├── agent/               # Model selector, tone, settings panel, token bar
        │   ├── email/               # Composer, reply output, feedback widget
        │   ├── layout/              # Navbar with theme toggle, page wrapper
        │   ├── memory/              # Memory panel
        │   └── threads/             # Sidebar with history, chat view
        ├── hooks/                   # useAuth, useEmailAgent (streaming), useMemory
        ├── providers/               # ThemeProvider (next-themes)
        ├── services/                # HTTP clients for all API endpoints
        └── types/                   # Shared TypeScript interfaces
```

---

## Agent Pipeline

The core of MailMind is a LangGraph stateful pipeline that runs six nodes in sequence with conditional routing:

```
analyze → retrieve → [web_search?] → draft → refine → score
                          ↑
                   skipped if web search is disabled
```

**analyze** — runs structural pre-analysis via `EmailAnalyzerTool` (urgency detection, question detection, topic classification) then calls the LLM to extract intent, sentiment, urgency, and key points as structured JSON.

**retrieve** — searches Pinecone for the most semantically similar past interactions for this user, using the intent and email content as the query vector. Results are injected into the draft prompt as long-term context.

**web_search** — conditionally executed via `add_conditional_edges`. When enabled by the user, calls Tavily with a truncated version of the email content and injects the results into the draft prompt. Skipped entirely when disabled, saving latency.

**draft** — generates the first version of the reply using all available context: email analysis, retrieved memory, web search results, conversation history (last 10 exchanges), tone setting, and the user's reply hint. The hint is injected as a CRITICAL INSTRUCTION.

**refine** — polishes the draft for clarity and tone consistency, re-enforces the reply hint so it cannot be softened or reversed, then persists a summary of the interaction to Pinecone memory and saves a `MemoryLog` record to the database.

**score** — asks the LLM to evaluate how well the reply addresses the original email and returns a confidence score between 0.0 and 1.0, displayed as a percentage badge on the reply.

---

## Features in Detail

### Reply Hint
Before generating, you can type a hint to guide the reply direction — for example "decline politely", "ask for a two week extension", or "keep it under three sentences". The hint is injected as a critical instruction into both the draft and refine nodes so it cannot be overridden at any stage.

### Streaming
Replies are streamed word by word using Server-Sent Events. The frontend connects to `POST /agent/reply/stream` which runs the pipeline up to the draft node, then streams the refine node output token by token. A final `done` event carries the thread ID, usage, confidence score, and memory status so the frontend can update its state without making a second request.

### Long-Term Memory
Every reply is summarised and stored in Pinecone as a 1536-dimensional vector embedding using `text-embedding-3-small`. Memories are stored in per-user namespaces to ensure complete isolation between accounts. On each new request, the retrieve node performs a cosine similarity search and injects the most relevant past contexts. Memory items are visible and deletable from the Memory page. Automatic pruning removes memories older than 90 days or when the total count exceeds 100 items per user.

### Conversation Threading
Each session is organised into a thread stored in the database. Threads appear in the left sidebar, can be renamed inline, deleted individually, or cleared all at once. When you resume a thread, the full exchange history is loaded and the last 10 exchanges are passed to the agent as conversation context. Threads are only created in the database after the agent successfully completes, so failed requests do not leave ghost entries.

### Feedback Loop
Each generated reply has a thumbs up / thumbs down rating. On thumbs down, the Redis cache is invalidated and the rejected reply is deleted from the thread history. If you add a comment such as "too formal", it is wrapped as a correction instruction and the agent retries immediately with the correction injected into the prompt. The corrected reply replaces the rejected one in the chat view rather than adding a new entry.

### Confidence Score
After every reply the score node asks the LLM to rate how well the reply addressed the original email. The result is stored in the database and displayed as a colour-coded badge — green for 80% and above, amber for 60–79%, red below 60%.

### Redis Caching
Identical requests — same email content, tone, model, and hint — return the cached reply instantly without running the agent. The cache key is a SHA-256 hash of those four values. Cache entries expire after one hour and are invalidated immediately when the user gives negative feedback.

### Rate Limiting
The agent endpoint is limited to 20 requests per minute per IP address. The login and register endpoints are limited to 10 per minute. Limits are configurable via environment variables.

### Security
Passwords are hashed with bcrypt before storage. All endpoints except register and login require a valid JWT token. Tokens expire after 7 days. All API keys are loaded from environment variables and never committed to version control. CORS is configured to only allow requests from the frontend URL.

---

## Getting Started

### Prerequisites

- Python 3.10 or higher — [python.org](https://www.python.org/downloads/)
- Node.js 18 or higher — [nodejs.org](https://nodejs.org/)
- UV — install with `pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Redis — local installation or a free cloud instance at [Redis Cloud](https://redis.com/try-free/)
- API keys for OpenAI and Pinecone (minimum required)

| Service | Required | Free Tier | Sign Up |
|---------|----------|-----------|---------|
| OpenAI | Yes | $5 credit | [platform.openai.com](https://platform.openai.com) |
| Pinecone | Yes | 1 free index | [pinecone.io](https://pinecone.io) |
| Tavily | No | 1000 req/month | [tavily.com](https://tavily.com) |
| Anthropic | No | Pay as you go | [console.anthropic.com](https://console.anthropic.com) |
| LangSmith | No | Free tier | [smith.langchain.com](https://smith.langchain.com) |

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/Janet-1414/mailmind.git
cd mailmind
```

### Step 2 — Configure environment variables

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in your API keys:

```env
SECRET_KEY=pick-any-long-random-string-here
DATABASE_URL=sqlite:///./mailmind.db

OPENAI_API_KEY=your-openai-key
OPENAI_TIMEOUT=30.0

ANTHROPIC_API_KEY=your-anthropic-key
ANTHROPIC_TIMEOUT=30.0

PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=mailmind

REDIS_URL=redis://localhost:6379

TAVILY_API_KEY=your-tavily-key

LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=your-langsmith-key
LANGCHAIN_PROJECT=mailmind

RATE_LIMIT_PER_MINUTE=20
MEMORY_MAX_ITEMS=100
MEMORY_PRUNE_DAYS=90
MAX_HISTORY_EXCHANGES=10
```

### Step 3 — Set up Pinecone index

1. Go to [pinecone.io](https://pinecone.io) and log in
2. Click **Create Index**
3. Name: `mailmind`, Dimensions: `1536`, Metric: `cosine`
4. Click **Create**

### Step 4 — Install backend dependencies and run migrations

```bash
cd backend
uv sync
uv run alembic upgrade head
```

### Step 5 — Start the backend

```bash
uv run uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`. You should see:
```
INFO | app.main | MailMind starting up…
INFO | app.main | Database tables verified.
INFO | Application startup complete.
```

### Step 6 — Start the frontend

Open a new terminal:

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Frontend runs at `http://localhost:3000`.

### Step 7 — Open the app

Go to `http://localhost:3000`, register an account, and start using MailMind.

### Running Tests

```bash
cd backend
uv run pytest
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | Yes | — | Long random string for JWT signing |
| `DATABASE_URL` | Yes | `sqlite:///./mailmind.db` | SQLite locally, PostgreSQL in production |
| `OPENAI_API_KEY` | Yes | — | OpenAI API key |
| `OPENAI_TIMEOUT` | No | `30.0` | Seconds before OpenAI call times out |
| `ANTHROPIC_API_KEY` | No | — | Enables Claude models |
| `ANTHROPIC_TIMEOUT` | No | `30.0` | Seconds before Anthropic call times out |
| `PINECONE_API_KEY` | Yes | — | Pinecone API key |
| `PINECONE_INDEX_NAME` | Yes | `mailmind` | Must match the index you created |
| `REDIS_URL` | Yes | `redis://localhost:6379` | Redis connection string |
| `TAVILY_API_KEY` | No | — | Enables web search feature |
| `LANGCHAIN_TRACING_V2` | No | `false` | Set to `true` to enable LangSmith |
| `LANGCHAIN_API_KEY` | No | — | LangSmith API key |
| `LANGCHAIN_PROJECT` | No | `mailmind` | LangSmith project name |
| `RATE_LIMIT_PER_MINUTE` | No | `20` | Agent endpoint requests per minute per IP |
| `MEMORY_MAX_ITEMS` | No | `100` | Max memory items per user before pruning |
| `MEMORY_PRUNE_DAYS` | No | `90` | Age in days before memories are pruned |
| `MAX_HISTORY_EXCHANGES` | No | `10` | Max thread exchanges passed to agent |
| `FRONTEND_URL` | No | — | Frontend origin for CORS in production |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT token |
| GET | `/auth/me` | Get current user profile |
| PATCH | `/auth/me` | Update name and email |
| POST | `/auth/change-password` | Change password |
| DELETE | `/auth/me` | Delete account |
| POST | `/agent/reply` | Generate a reply (standard JSON) |
| POST | `/agent/reply/stream` | Generate a reply (SSE streaming) |
| GET | `/threads` | List all threads |
| GET | `/threads/{id}` | Get thread with full exchange history |
| PATCH | `/threads/{id}/title` | Rename a thread |
| DELETE | `/threads/{id}` | Delete a thread |
| GET | `/memory` | List memory items |
| DELETE | `/memory/{id}` | Delete a memory item |
| DELETE | `/memory` | Clear all memory |
| POST | `/memory/prune` | Manually trigger memory pruning |
| POST | `/feedback` | Submit reply feedback |
| GET | `/health` | Health check |

---

## Using the Tools

### EmailAnalyzerTool
This runs automatically on every request before the LLM is called. It performs structural analysis of the email text — detecting urgency keywords, counting questions that need to be answered, estimating word count, and classifying topics such as meeting, payment, or follow-up. The results are logged and injected into the analyze node prompt to give the LLM additional structured context before it begins reasoning.

You do not need to do anything to use it — it runs as part of every pipeline execution.

### Web Search Tool
The web search tool uses the Tavily API to fetch current information from the web. It is activated by toggling the **Web search** switch in the Agent Settings panel on the dashboard. When enabled, the web_search node queries Tavily with the email content and injects the results into the draft prompt. This is useful for emails that reference current events, recent product releases, or any topic where up-to-date information would improve the reply. When a web search is used, "Web search" appears as a source tag on the generated reply.

---

## Design System

MailMind uses the Midnight Slate colour palette designed to work cleanly in both light and dark modes.

| Name | Light Mode | Dark Mode | Used For |
|------|-----------|-----------|---------|
| Background | `#F4F6F9` | `#0F172A` | Page background |
| Surface | `#FFFFFF` | `#1E293B` | Cards, panels |
| Primary | `#1E3A5F` | `#38BDF8` | Headings, buttons, logo |
| Accent | `#3B82F6` | `#818CF8` | Active states, links, badges |
| Muted | `#64748B` | `#94A3B8` | Secondary text, labels |
| Border | `#E2E8F0` | `#334155` | Card borders, dividers |

Fonts: **Playfair Display** (headings) · **DM Sans** (body) · **JetBrains Mono** (token counts, timestamps)

---

## Known Limitations

- SQLite is used for local development. Switch `DATABASE_URL` to a PostgreSQL connection string for production deployments.
- No Gmail or Outlook OAuth integration — emails must be pasted manually into the composer.
- The confidence score is generated by the same LLM that wrote the reply, which creates a self-evaluation bias. A separate evaluation model would be more objective.
- Memory grows on every reply. The automatic pruning at 90 days and 100 items prevents unbounded growth but there is no relevance-based pruning yet.
- Streaming requires the backend to hold an open HTTP connection per request. This works well locally but may require additional configuration on some cloud platforms.