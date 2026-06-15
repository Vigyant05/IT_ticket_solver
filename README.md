# HALO Support

> **H**elpdesk **A**utomation and **L**ogic **O**perations

An end-to-end AI-driven IT support platform that **classifies, routes, and resolves** incoming tickets with zero manual dispatch. Built on a unified **LangGraph pipeline** backend and a three-portal **Next.js** frontend for Admins, Employees, and Users.

---

## Architecture Overview

```
                  ┌─────────────────────────────┐
                  │      Next.js Frontend         │
                  │   Admin · Employee · User     │
                  └─────────────┬───────────────┘
                                │ REST / JSON
                  ┌─────────────▼───────────────┐
                  │     FastAPI Gateway           │
                  │  Auth · Tickets · Messaging   │
                  │        (server.py)             │
                  └─────────────┬───────────────┘
                                │ LangGraph Orchestration
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
 ┌────────────────┐   ┌──────────────────┐   ┌──────────────────┐
 │  Action Path   │   │    RAG Path      │   │  Complex Path    │
 │  n8n Webhook   │   │  ChromaDB + LLM  │   │  Human Expert    │
 │  (Automation)  │   │  (FAQ Resolver)  │   │  (Skill Routing) │
 └────────────────┘   └──────────────────┘   └──────────────────┘
```

The **AI Router Agent** (Groq LPU) classifies every incoming ticket. The **LangGraph Brain** then dispatches it to the correct microservice path — fully automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, TailwindCSS 4, Zustand, TanStack Query |
| **Backend API** | Python, FastAPI, SQLAlchemy, Uvicorn |
| **AI / LLM** | Groq LPU — Llama 4 Scout (router), Llama 3.1 8B (pipeline) |
| **RAG LLM** | Ollama Cloud Qwen 3.5 (primary) → Groq Llama 3.3 70B (fallback) |
| **Orchestration** | LangGraph (unified state-machine pipeline) |
| **Automation** | n8n (Action Path webhook workflows) |
| **Vector DB** | ChromaDB (semantic search for RAG knowledge base) |
| **Database** | SQLite (default, swappable to PostgreSQL via `DATABASE_URL`) |
| **Fonts** | Inter · Manrope · Outfit (Google Fonts) |

---

## Project Structure

```
IT_ticket_solver/
├── logo.png                         # HALO Support brand logo
│
├── frontend/                        # Next.js monorepo dashboard
│   ├── app/
│   │   ├── auth/                    # AuthContext + ProtectedRoute
│   │   ├── login/                   # Login page (role selector)
│   │   ├── admin/                   # Admin portal
│   │   │   ├── tickets/             # Ticket list + reassign + status
│   │   │   ├── insights/            # AI telemetry + performance analytics
│   │   │   ├── employees/           # Staff directory
│   │   │   └── chatbot/             # Employee messaging
│   │   ├── employees/               # Employee portal
│   │   │   ├── resolve/             # Active ticket resolution chat
│   │   │   ├── history/             # Resolved ticket history
│   │   │   ├── chatbot/             # Staff messaging
│   │   │   └── profile/             # Employee profile + stats
│   │   └── user/                    # User portal
│   │       ├── dashboard/           # Ticket overview + quick-raise
│   │       ├── support/             # AI Support chat (pipeline entry)
│   │       ├── messaging/           # Direct chat with assigned agents
│   │       └── history/             # Ticket history with "Solved By"
│   ├── admin/                       # Admin-scoped components, hooks, store
│   ├── employees/                   # Employee-scoped components, store
│   ├── user/                        # User-scoped components, store
│   ├── lib/                         # Shared API client (api.ts)
│   └── public/
│       └── logo.png                 # Served logo asset
│
├── backend/
│   ├── server.py                    # Unified FastAPI + LangGraph server
│   ├── telemetry.py                 # TelemetryEngine (CGR, RPI, HLO, SSE)
│   ├── requirements.txt
│   ├── ai_router_agent/             # Groq LPU ticket classifier
│   ├── action_path/                 # n8n webhook integration
│   ├── rag_path/                    # ChromaDB + LLM RAG pipeline
│   │   ├── app.py                   # FastAPI RAG API (port 8002)
│   │   └── ingest_data.py           # Load historical data into ChromaDB
│   └── complex_path/                # Human expert routing engine
│       ├── models.py                # SQLAlchemy: Employee, Ticket, ChatMessage
│       ├── database.py              # DB connection (SQLite / PostgreSQL)
│       ├── routing_engine.py        # Skill + load-based agent assignment
│       └── seed_data.py             # Seed 25 employees + 25 tickets
│
└── dataset/                         # RAG training data + test datasets
```

---

## Quick Start

### Prerequisites
- **Python 3.10+** with `pip`
- **Node.js 18+** with `npm`
- **Groq API Key** — [console.groq.com](https://console.groq.com) (free tier available)
- **Ollama API Key** *(optional)* — for RAG primary LLM; system auto-falls back to Groq

---

### 1. Backend Setup

**For macOS/Linux:**
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
echo "GROQ_API_KEY=your_groq_key" > ai_router_agent/.env
echo "GROQ_API_KEY=your_groq_key" > complex_path/.env

# RAG path — Ollama Cloud primary, Groq fallback
cat > rag_path/.env << EOF
OLLAMA_API_KEY=your_ollama_key
GROQ_API_KEY=your_groq_key
EOF

# Seed the database (25 employees + 25 test tickets)
cd complex_path && python seed_data.py && cd ..
```

**For Windows (PowerShell):**
```powershell
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
echo "GROQ_API_KEY=your_groq_key" > ai_router_agent/.env
echo "GROQ_API_KEY=your_groq_key" > complex_path/.env

# RAG path — Ollama Cloud primary, Groq fallback
Set-Content -Path "rag_path/.env" -Value "OLLAMA_API_KEY=your_ollama_key`nGROQ_API_KEY=your_groq_key"

# Seed the database (25 employees + 25 test tickets)
cd complex_path; python seed_data.py; cd ..
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
```

---

### 3. Run the Application

Open **three terminals**:

**Terminal 1 — Unified Backend (API + AI Pipeline)**

*For macOS/Linux:*
```bash
cd backend
PYTHONPATH=complex_path python server.py
# → Serving on http://localhost:8000
# → Swagger Docs: http://localhost:8000/docs
```

*For Windows (PowerShell):*
```powershell
cd backend
$env:PYTHONPATH="complex_path"
python server.py
# → Serving on http://localhost:8000
# → Swagger Docs: http://localhost:8000/docs
```

**Terminal 2 — RAG Knowledge Base** *(Same for all OS)*
```bash
cd backend/rag_path

# First run only — ingest historical ticket data into ChromaDB
python ingest_data.py

# Start the RAG API
uvicorn app:app --port 8002 --reload
# → Serving on http://localhost:8002
# You will see either:
#   [LLM] ✅ Ollama Cloud — Qwen 3.5
#   [LLM] ✅ Groq fallback — Llama 3.3 70B
```

**Terminal 3 — Frontend** *(Same for all OS)*
```bash
cd frontend
npm run dev
# → Dashboard at http://localhost:3000
```

Navigate to `http://localhost:3000` — you will be redirected to the login page.

---

## Login Credentials

All accounts use password **`12345`**.

| Role | Name | Email |
|------|------|-------|
| **Admin** | Admin\_System | admin@msrit.com |
| **User** | Aditi | aditi@msrit.com |
| **User** | Kavya | kavya@msrit.com |
| **User** | Abhishek | abhishek@msrit.com |
| **Employee** | Vigyant N | veryone@msrit.com |
| **Employee** | *(25 IT staff)* | *(see `seed_data.py`)* |

---

## Feature Overview

### Admin Portal

| Feature | Details |
|---|---|
| **Ticket Dashboard** | Paginated table with search, status filtering, and expandable resolution notes |
| **Reassign Agent** | Click any agent cell → searchable dropdown listing all employees with team tag (L1/L2/SEC…), role, availability, and current load |
| **Status Management** | Inline dropdown to update ticket status; changes are persisted to the database |
| **Delete Ticket** | Permanently remove a ticket with load adjustment on the assigned agent |
| **Insights Dashboard** | Live resolution rate, total tickets, active employees, AI telemetry gauges |
| **Employee Directory** | Real-time availability, skill level, expertise tags, and current load per agent |
| **Messaging** | Direct chat with any IT employee |

### Employee Portal

| Feature | Details |
|---|---|
| **Resolve** | Full chat interface for working on active tickets; one-click "Resolve" that auto-saves resolution notes |
| **History** | All resolved tickets with resolution notes |
| **Profile** | Expertise tags, skill level, and ticket performance stats |
| **Messaging** | Peer-to-peer internal messaging |

### User Portal

| Feature | Details |
|---|---|
| **AI Support** | Chat-based assistant; classifies the issue and routes through the pipeline automatically |
| **Dashboard** | Quick overview of open/resolved tickets with a one-click "New Request" button |
| **Messaging** | Direct chat with the assigned IT agent (agent card auto-appears when assigned, auto-disappears when resolved) |
| **History** | Full ticket tracking with **"Solved By"** attribution — N8n / RAG Agent / Employee Name |

---

## AI Pipeline

### Ticket Lifecycle

```
User submits ticket
       │
       ▼
 AI Router Agent (Groq)
 Classifies: Action / FAQ / Complex
       │
   ┌───┴──────────────┐
   ▼                  ▼                  ▼
Action Path        FAQ Path           Complex Path
(n8n webhook)   (ChromaDB RAG)     (Skill routing)
auto-resolves   answers instantly   assigns human expert
status: action_path_resolved        status: complex_path_resolved
       └──────────────────────────────┘
                    │
         Telemetry captured + stored
```

### LLM Fallback Strategy (RAG Path)

```
Startup → Test Ollama Cloud (Qwen 3.5 397B)
           ↓ (timeout / subscription error)
         → Fall back to Groq (Llama 3.3 70B)
           ↓ (API key missing)
         → Raw ChromaDB retrieval only
```

---

## AI Telemetry Metrics

The **Admin Insights** page exposes 4 real-time metrics powered by the `TelemetryEngine` in `telemetry.py`. Scores are computed at ticket-creation time and stored on each `Ticket` database row.

API endpoint: `GET /api/metrics?hlo_days=30`

| Metric | Abbreviation | Description | Formula |
|---|---|---|---|
| **Context Grounding Ratio** | CGR | How much of the RAG answer is sourced from the ChromaDB knowledge base vs. LLM general knowledge. High = less hallucination. | `Tokens from context / Total response tokens` |
| **Routing Precision Index** | RPI | Accuracy of the AI Router Agent — did the first-assigned path resolve the ticket successfully? | `(Tickets resolved on first path / Total tickets) × 100` |
| **Human Labor Offset** | HLO | Automation ROI — percentage of tickets fully resolved by AI (Action + FAQ paths) without human intervention. | `(Automated resolutions / Total monthly tickets) × 100` |
| **Semantic Search Efficiency** | SSE | Health of the ChromaDB vector store — combines vector proximity with LLM confidence. Near 1.0 = highly relevant knowledge base. | `(1 − avg_distance / threshold) × confidence` |

Each metric card on the dashboard is **colour-coded**: 🟢 ≥ 80% · 🟡 ≥ 50% · 🔴 < 50%.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login` | Authenticate (email + password + role) |
| `POST` | `/api/logout` | Invalidate session token |
| `GET` | `/api/admin/stats` | Dashboard statistics (ticket counts, resolution rate) |
| `GET` | `/api/admin/tickets` | All tickets with agent info and pipeline path |
| `GET` | `/api/admin/employees` | Employee directory (excludes Users/Admin) |
| `GET` | `/api/employee/{id}` | Single employee profile |
| `GET` | `/api/employee/{id}/tickets` | Tickets assigned to an employee |
| `GET` | `/api/user/{id}/tickets` | Tickets raised by a user |
| `POST` | `/api/tickets` | Create a new ticket |
| `PUT` | `/api/ticket/{id}` | Update ticket fields (status, category, severity) |
| `PUT` | `/api/ticket/{id}/resolve` | Mark ticket resolved (captures resolution notes) |
| `POST` | `/api/ticket/{id}/reassign` | Reassign ticket to a new employee (adjusts load counts) |
| `DELETE` | `/api/ticket/{id}` | Delete a ticket (adjusts agent load) |
| `GET` | `/api/messages` | Retrieve messages (by ticket\_id, user1, or user2) |
| `POST` | `/api/messages` | Send a message |
| `GET` | `/api/metrics` | AI pipeline telemetry (CGR, RPI, HLO, SSE) |
| `POST` | `/submit_ticket` | AI-route a ticket through the full pipeline |

---

## Key Design Decisions

### Unified Server
`server.py` acts as both the REST API gateway and the LangGraph orchestrator. There is no separate microservice hop for routing — the pipeline executes inside the same FastAPI process, keeping latency low and deployment simple.

### Messaging Architecture
- **AI Support** (`/user/support`) — Fully automated. The chat submits a ticket through the pipeline and returns the AI response.
- **User Messaging** (`/user/messaging`) — Human-to-human. Users chat with their assigned IT agent in real time.
- **Agent Lifecycle** — The assigned agent auto-appears in the user's sidebar after assignment and auto-disappears once the ticket is resolved.

### Ticket Attribution ("Solved By")
| Resolver | Trigger |
|---|---|
| **N8n** | Action path completed via webhook |
| **RAG Agent** | FAQ path resolved by ChromaDB + LLM |
| **Employee Name** | Complex path — human expert resolved |

### Reassignment Flow
When an admin reassigns a ticket via the dropdown, the system atomically: decrements the previous agent's `current_load`, increments the new agent's `current_load`, updates `assigned_employee_id`, and sets the status to `assigned`.

### Telemetry Persistence
Metrics are computed once at ticket-creation/resolution time and stored on the `Ticket` row. The dashboard aggregates these pre-computed columns, keeping the `/api/metrics` query fast regardless of ticket volume.

---

## Security

- **Token-based authentication** — Login issues a session token stored in `sessionStorage`
- **Role-based access control** — `ProtectedRoute` enforces Admin / Employee / User roles on every page
- **Route protection** — Unauthenticated requests are always redirected to `/login`
- **CORS configured** — Backend allows requests from `localhost:3000`
- **Input validation** — FastAPI Pydantic models validate all request bodies

---

## Environment Variables Summary

| File | Variable | Description |
|---|---|---|
| `ai_router_agent/.env` | `GROQ_API_KEY` | LLM router + classifier |
| `complex_path/.env` | `GROQ_API_KEY` | Complex path LLM |
| `complex_path/.env` | `DATABASE_URL` | *(optional)* PostgreSQL URL; defaults to SQLite |
| `rag_path/.env` | `OLLAMA_API_KEY` | RAG primary LLM (Qwen 3.5) |
| `rag_path/.env` | `GROQ_API_KEY` | RAG fallback LLM (Llama 3.3 70B) |

> **Tip:** Each directory has a `.env.example` file. Copy it to `.env` and fill in your keys — no values need to be invented from scratch.

---

## Troubleshooting

### `Module not found: Can't resolve '@admin/lib/utils'` (or any `@admin/lib/*`)

This was caused by a `lib/` entry in `.gitignore` (inherited from Python venv templates) that silently blocked all frontend `lib/` directories from being committed. It has been fixed — pull the latest and run `npm install`.

*For macOS/Linux:*
```bash
git pull
cd frontend && npm install && npm run dev
```

*For Windows (PowerShell):*
```powershell
git pull
cd frontend; npm install; npm run dev
```

---

### Backend import errors (`ModuleNotFoundError`)

Make sure you install dependencies from the **root** `backend/requirements.txt` only — there are no sub-folder requirement files.

```bash
cd backend
pip install -r requirements.txt
```

Common missing packages and their fix:

| Error | Fix |
|---|---|
| `No module named 'groq'` | `pip install groq` |
| `No module named 'tiktoken'` | `pip install tiktoken` |
| `No module named 'dotenv'` | `pip install python-dotenv` |
| `No module named 'langgraph'` | `pip install langgraph langchain-core langchain-groq` |
| `No module named 'chromadb'` | `pip install chromadb sentence-transformers` |

---

### `sqlite3.OperationalError: no such table: tickets`

The database has not been seeded. Run:

```bash
cd backend/complex_path
python seed_data.py
```

---

### RAG path returns empty responses

The ChromaDB vector store is empty on a fresh clone (it is gitignored). Ingest the knowledge base first:

```bash
cd backend/rag_path
python ingest_data.py
uvicorn app:app --port 8002 --reload
```

---

### Frontend logo missing (broken image)

The logo is served from `frontend/public/logo.png`. If it's missing after cloning, copy it manually:

*For macOS/Linux:*
```bash
cp logo.png frontend/public/logo.png
```

*For Windows (PowerShell):*
```powershell
Copy-Item logo.png -Destination frontend/public/logo.png
```

