# IT Ticket Solver

An end-to-end IT support automation system that **classifies, routes, and resolves** incoming tickets using AI. The platform features a **Unified LangGraph Pipeline** on the backend for intelligent ticket routing, paired with a **Next.js dashboard** for Admin, Employee, and User workflows — all connected to a live PostgreSQL/SQLite database.

---

## Architecture Overview

```
                  ┌──────────────────────────┐
                  │     Next.js Frontend      │
                  │  (Admin / Employee / User) │
                  └────────────┬─────────────┘
                               │ REST API
                  ┌────────────▼─────────────┐
                  │   FastAPI Gateway (api.py) │
                  │   Auth · Tickets · Stats   │
                  └────────────┬─────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌────────────┐   ┌──────────────┐   ┌──────────────┐
     │ Action Path │   │   RAG Path   │   │ Complex Path │
     │  (n8n Auto) │   │ (ChromaDB +  │   │ (Human Expert│
     │             │   │  Ollama LLM) │   │   Routing)   │
     └────────────┘   └──────────────┘   └──────────────┘
```

**AI Router Agent** (Groq LPU) classifies every ticket and the **LangGraph Brain** routes it to the correct microservice path.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, TailwindCSS 4, Zustand, TanStack Query |
| **Backend API** | Python, FastAPI, SQLAlchemy, Uvicorn |
| **AI / LLM** | Groq LPU (Router + Complex Path), Ollama Cloud (RAG Path) |
| **Orchestration** | LangGraph (Unified Pipeline) |
| **Automation** | n8n (Action Path workflows) |
| **Vector DB** | ChromaDB (RAG Path) |
| **Database** | SQLite (default, swappable to PostgreSQL) |

---

## Project Structure

```
IT_ticket_solver/
├── frontend/                    # Next.js Dashboard
│   ├── app/
│   │   ├── auth/                # AuthContext, ProtectedRoute
│   │   ├── login/               # Login page
│   │   ├── admin/               # Admin dashboard pages
│   │   │   ├── tickets/         # Ticket management
│   │   │   ├── insights/        # System performance analytics
│   │   │   ├── employees/       # Staff directory
│   │   │   └── chatbot/         # AI assistant
│   │   ├── employees/           # Employee dashboard pages
│   │   │   ├── resolve/         # Ticket resolution chat
│   │   │   ├── active/          # Active assigned tickets
│   │   │   ├── history/         # Ticket history
│   │   │   └── profile/         # Employee profile
│   │   └── user/                # User dashboard pages
│   │       ├── support/         # Raise tickets & FAQ
│   │       └── history/         # Ticket tracking
│   ├── admin/                   # Admin components, hooks, store
│   ├── employees/               # Employee components, store
│   ├── user/                    # User components, store
│   └── lib/                     # Shared API client
│
├── backend/
│   ├── api.py                   # FastAPI gateway (Auth, CRUD, Stats)
│   ├── pipeline.py              # Unified LangGraph brain
│   ├── ai_router_agent/         # Groq-powered ticket classifier
│   ├── action_path/             # n8n automation workflows
│   ├── rag_path/                # ChromaDB + Ollama RAG pipeline
│   ├── complex_path/            # Human expert routing engine
│   │   ├── models.py            # SQLAlchemy models (Employee, Ticket)
│   │   ├── database.py          # DB connection setup
│   │   └── seed_data.py         # Seed employees into database
│   └── requirements.txt
│
└── dataset/                     # Training/test ticket datasets
```

---

## Quick Start

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **Groq API Key** (for AI Router + Complex Path)
- **Ollama API Key** (for RAG Path)

### 1. Backend Setup

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Create .env files for each path
echo "GROQ_API_KEY=your_key" > ai_router_agent/.env
echo "GROQ_API_KEY=your_key" > complex_path/.env
echo "OLLAMA_API_KEY=your_key" > rag_path/.env

# Seed the employee database
cd complex_path && python seed_data.py && cd ..
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Run the Application

Open **two terminals**:

```bash
# Terminal 1 — Unified Backend (API + AI Pipeline)
cd backend
PYTHONPATH=complex_path python server.py
# → API + pipeline running at http://localhost:8000
```

```bash
# Terminal 2 — Frontend
cd frontend
npm run dev
# → Dashboard at http://localhost:3000
```

Open `http://localhost:3000` in your browser. You'll be redirected to the login page.

> **Need AI routing too?** Add a third terminal for the RAG knowledge base:
> ```bash
> # Terminal 3 — RAG Path (optional, needed for FAQ ticket routing)
> cd backend/rag_path
> uvicorn app:app --port 8002 --reload
> ```

---

## Login Credentials

| Role | Name | Email | Password |
|------|------|-------|----------|
| **Admin** | Admin System | admin@msrit.com | 12345 |
| **Employee** | Vigyant N | veryone@msrit.com | 12345 |
| **Employee** | Aditi | aditi@msrit.com | 12345 |
| **Employee** | Kavya | kavya@msrit.com | 12345 |
| **Employee** | Abhishek | abhishek@msrit.com | 12345 |
| **User** | Any seeded user | (see seed_data.py) | 12345 |

---

## Dashboard Features

### Admin Dashboard
- **Tickets** — View all tickets in the system with pagination, search, and status filtering
- **Insights** — Live performance analytics: total tickets, resolution rate, open/in-progress breakdown, team distribution, and category analysis
- **Employees** — Staff directory showing real-time availability, skill levels, team assignments, and current ticket load
- **Chatbot** — AI assistant interface for system queries
- **Logout** — Clears session and redirects to login

### Employee Dashboard
- **Profile** — Personalized profile showing name, role, team, expertise tags, and performance stats (fetched per logged-in user)
- **Active Tickets** — Only tickets assigned to the logged-in employee (non-resolved)
- **Ticket History** — Complete history of all assigned tickets with status and priority
- **Resolve** — Chat interface for working on ticket resolution
- **Logout** — Clears session and redirects to login

### User Dashboard
- **Support** — Raise new IT tickets via chat interface, browse Frequent Solutions (FAQ)
- **History** — Track submitted ticket status
- **Logout** — Clears session and redirects to login

---

## Backend Microservices

### Unified Server (`server.py`) — replaces `api.py` + `pipeline.py`
A single FastAPI app that serves both the frontend REST API **and** the LangGraph AI routing pipeline.

```bash
cd backend
PYTHONPATH=complex_path python server.py
# Docs: http://localhost:8000/docs
```

| Endpoint | Description |
|----------|-------------|
| `POST /submit_ticket` | AI-routes a ticket through classify → Action / FAQ / Complex |
| `GET /api/*` | All frontend REST endpoints (auth, stats, employees, tickets) |

### 1. Action Path (n8n Automation)
Handles simple, automatable tickets (password resets, WiFi fixes) via n8n workflows.

```bash
# Setup: Import backend/action_path/MiniPrj.json into n8n
# Then update the webhook URL in action_pipeline.py
python action_pipeline.py --csv test_action_tickets.csv --limit 10 --production
```

### 2. RAG Path (FAQ / Knowledge Base)
Answers FAQ-type tickets by retrieving solutions from past tickets stored in ChromaDB.
Run this on **port 8002** (the unified server occupies 8000).

```bash
cd backend/rag_path
python ingest_data.py          # Load historical data (first run only)
uvicorn app:app --port 8002    # Start RAG API
```

### 3. Complex Path (Human Expert Routing)
Routes severe/complex tickets to the best-matched human expert based on skill matching and workload balancing.
This is **built into `server.py`** — no separate process needed.

```bash
# Run standalone for testing only
cd backend/complex_path
uvicorn main:app --port 8001 --reload
```

### 4. AI Router Agent (Classifier)
The Groq-powered LLM classifier that determines which path each ticket should take.
Also **built into `server.py`** — no separate process needed.

```bash
# Run standalone for testing only
cd backend/ai_router_agent
python router_agent.py "I need a password reset"          # Single test
python router_agent.py --csv test_tickets.csv              # Batch test
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/login` | Authenticate with email + password + role |
| `POST` | `/api/logout` | Invalidate session token |
| `GET` | `/api/admin/stats` | Dashboard statistics (ticket counts, resolution rate) |
| `GET` | `/api/admin/tickets` | All tickets with agent info |
| `GET` | `/api/admin/employees` | Employee directory (excludes Users/Admin) |
| `GET` | `/api/employee/{id}` | Single employee profile |
| `GET` | `/api/employee/{id}/tickets` | Tickets assigned to specific employee |
| `POST` | `/api/tickets` | Create a new ticket |
| `PUT` | `/api/tickets/{id}` | Update ticket details |
| `POST` | `/api/tickets/{id}/resolve` | Mark ticket as resolved |

---

## Security

- **Token-based authentication** — Login returns a session token stored in `localStorage`
- **Role-based access control** — `ProtectedRoute` component enforces Admin/Employee/User roles on every page
- **Route protection** — Unauthenticated users are always redirected to `/login`
- **CORS configured** — Backend allows requests from `localhost:3000`
