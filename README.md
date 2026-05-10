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
                  │   FastAPI Gateway          │
                  │  Auth · Tickets · Messaging│
                  │       (server.py)           │
                  └────────────┬─────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌────────────┐   ┌──────────────┐   ┌──────────────┐
     │ Action Path │   │   RAG Path   │   │ Complex Path │
     │  (n8n Auto) │   │ (ChromaDB +  │   │ (Human Expert│
     │             │   │  LLM w/      │   │  Routing +   │
     │             │   │  Fallback)   │   │  Messaging)  │
     └────────────┘   └──────────────┘   └──────────────┘
```

**AI Router Agent** (Groq LPU) classifies every ticket and the **LangGraph Brain** routes it to the correct microservice path.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, TailwindCSS 4, Zustand, TanStack Query |
| **Backend API** | Python, FastAPI, SQLAlchemy, Uvicorn |
| **AI / LLM** | Ollama Cloud Qwen 3.5 (primary), Groq Llama 3.3 70B (fallback) |
| **Orchestration** | LangGraph (Unified Pipeline) |
| **Automation** | n8n (Action Path workflows) |
| **Vector DB** | ChromaDB (RAG Path) |
| **Database** | SQLite (default, swappable to PostgreSQL) |
| **Messaging** | Real-time ticket-based chat (User ↔ Employee) |

---

## Project Structure

```
IT_ticket_solver/
├── frontend/                    # Next.js Dashboard
│   ├── app/
│   │   ├── auth/                # AuthContext, ProtectedRoute
│   │   ├── login/               # Login page
│   │   ├── admin/               # Admin dashboard pages
│   │   │   ├── tickets/         # Ticket management + resolution notes
│   │   │   ├── insights/        # System performance analytics
│   │   │   ├── employees/       # Staff directory
│   │   │   └── chatbot/         # Employee messaging
│   │   ├── employees/           # Employee dashboard pages
│   │   │   ├── resolve/         # Ticket resolution chat
│   │   │   ├── active/          # Active assigned tickets
│   │   │   ├── history/         # Ticket history
│   │   │   ├── chatbot/         # Staff messaging
│   │   │   └── profile/         # Employee profile
│   │   └── user/                # User dashboard pages
│   │       ├── dashboard/       # Quick overview + raise tickets
│   │       ├── support/         # AI Support Assistant (FAQ + ticket creation)
│   │       ├── messaging/       # Direct chat with assigned IT agents
│   │       └── history/         # Ticket tracking with "Solved By" attribution
│   ├── admin/                   # Admin components, hooks, store
│   ├── employees/               # Employee components, store
│   ├── user/                    # User components, store
│   └── lib/                     # Shared API client
│
├── backend/
│   ├── server.py                # Unified FastAPI server (API + LangGraph pipeline)
│   ├── ai_router_agent/         # Groq-powered ticket classifier
│   ├── action_path/             # n8n automation workflows
│   ├── rag_path/                # ChromaDB + LLM RAG pipeline
│   │   └── app.py               # Ollama Cloud → Groq fallback LLM
│   ├── complex_path/            # Human expert routing engine
│   │   ├── models.py            # SQLAlchemy models (Employee, Ticket, ChatMessage)
│   │   ├── database.py          # DB connection setup
│   │   ├── routing_engine.py    # Skill-based agent assignment
│   │   └── seed_data.py         # Seed employees + 25 tickets into database
│   └── requirements.txt
│
└── dataset/                     # Training/test ticket datasets
```

---

## Quick Start

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **Groq API Key** (for AI Router + Complex Path + RAG fallback)
- **Ollama API Key** *(optional, for RAG Path primary LLM)*

### 1. Backend Setup

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Create .env files for each path
echo "GROQ_API_KEY=your_groq_key" > ai_router_agent/.env
echo "GROQ_API_KEY=your_groq_key" > complex_path/.env

# RAG path — Ollama Cloud (primary) + Groq (fallback)
cat > rag_path/.env << EOF
OLLAMA_API_KEY=your_ollama_key
GROQ_API_KEY=your_groq_key
EOF

# Seed the employee database (25 employees + 25 tickets)
cd complex_path && python seed_data.py && cd ..
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Run the Application

Open **three terminals**:

```bash
# Terminal 1 — Unified Backend (API + AI Pipeline)
cd backend
PYTHONPATH=complex_path python server.py
# → API + pipeline running at http://localhost:8000
```

```bash
# Terminal 2 — RAG Knowledge Base
cd backend/rag_path
uvicorn app:app --port 8002 --reload
# → RAG API at http://localhost:8002
# On startup you'll see which LLM was selected:
#   [LLM] ✅ Ollama Cloud connected — using Qwen 3.5
#   or
#   [LLM] ✅ Groq connected — using Llama 3.3 70B
```

```bash
# Terminal 3 — Frontend
cd frontend
npm run dev
# → Dashboard at http://localhost:3000
```

Open `http://localhost:3000` in your browser. You'll be redirected to the login page.

---

## Login Credentials

| Role | Name | Email | Password |
|------|------|-------|----------|
| **Admin** | Admin_System | admin@msrit.com | 12345 |
| **User** | Aditi | aditi@msrit.com | 12345 |
| **User** | Kavya | kavya@msrit.com | 12345 |
| **User** | Abhishek | abhishek@msrit.com | 12345 |
| **Employee** | Vigyant N | veryone@msrit.com | 12345 |
| **Employee** | *(25 IT staff)* | *(see seed_data.py)* | 12345 |

---

## Dashboard Features

### Admin Dashboard
- **Tickets** — View all tickets with pagination, search, status filtering, and expandable resolution notes
- **Insights** — Live performance analytics: total tickets, resolution rate, team distribution, and category breakdown
- **Employees** — Staff directory showing real-time availability, skill levels, and current ticket load
- **Messaging** — Direct messaging with all IT employees
- **Logout** — Clears session and redirects to login

### Employee Dashboard
- **Profile** — Personalized profile with expertise tags and performance stats
- **Active Tickets** — Tickets assigned to the logged-in employee
- **Ticket History** — Complete history of all assigned tickets
- **Resolve** — Chat interface for working on ticket resolution (with "Resolve Ticket" action)
- **Messaging** — Peer-to-peer staff messaging
- **Logout** — Clears session and redirects to login

### User Dashboard
- **Dashboard** — Quick overview of total/open/resolved tickets with "New Request" quick-raise
- **AI Support** — Chat-based AI assistant that classifies and routes tickets through the pipeline
- **Messaging** — Direct chat with assigned IT agents for complex tickets (agents auto-appear when assigned, auto-disappear when resolved)
- **History** — Full ticket tracking with "Solved By" attribution (N8n / RAG Agent / Employee Name)
- **Logout** — Clears session and redirects to login

---

## Backend Microservices

### Unified Server (`server.py`)
A single FastAPI app that serves the frontend REST API **and** the LangGraph AI routing pipeline.

```bash
cd backend
PYTHONPATH=complex_path python server.py
# Docs: http://localhost:8000/docs
```

| Endpoint | Description |
|----------|-------------|
| `POST /submit_ticket` | AI-routes a ticket through classify → Action / FAQ / Complex |
| `GET /api/*` | All frontend REST endpoints (auth, stats, employees, tickets, messaging) |

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

**LLM Fallback System:**
```
Startup → Try Ollama Cloud (Qwen 3.5 397B)
            ↓ (fails? e.g. subscription, network)
          → Fall back to Groq (Llama 3.3 70B Versatile)
            ↓ (fails? e.g. API key missing)
          → Raw retrieval only (no generation)
```

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
| `GET` | `/api/admin/tickets` | All tickets with agent info and resolution notes |
| `GET` | `/api/admin/employees` | Employee directory (excludes Users/Admin) |
| `GET` | `/api/employee/{id}` | Single employee profile |
| `GET` | `/api/employee/{id}/tickets` | Tickets assigned to specific employee |
| `GET` | `/api/user/{id}/tickets` | Tickets raised by a specific user |
| `POST` | `/api/tickets` | Create a new ticket |
| `PUT` | `/api/ticket/{id}` | Update ticket details |
| `PUT` | `/api/ticket/{id}/resolve` | Mark ticket as resolved (auto-captures resolution notes) |
| `DELETE` | `/api/ticket/{id}` | Delete a ticket |
| `POST` | `/api/messages` | Send a message (ticket-based or direct) |
| `GET` | `/api/messages` | Retrieve messages (by ticket_id, user1, or user2) |
| `POST` | `/submit_ticket` | AI-route a ticket through the full pipeline |

---

## Key Design Decisions

### Messaging Architecture
- **AI Support** (`/user/support`) — Strictly automated. Classifies tickets and returns AI-generated responses.
- **Messaging** (`/user/messaging`) — Human-to-human. Users chat directly with their assigned IT agent.
- **Agent Lifecycle** — Assigned agents auto-appear in the user's messaging sidebar; they auto-disappear when the ticket is resolved.

### Ticket Attribution
The "Solved By" column in ticket history shows who resolved each ticket:
- **N8n** — Action path (automated workflows)
- **RAG Agent** — FAQ path (AI-generated answers)
- **Employee Name** — Complex path (human expert)

### LLM Fallback (RAG Path)
On startup, the RAG server tests Ollama Cloud with a lightweight "Say OK" message. If it succeeds, Qwen 3.5 is used for generation. If it fails (subscription required, network error, etc.), Groq Llama 3.3 70B takes over automatically. Both API keys are kept in `.env`.

---

## Security

- **Token-based authentication** — Login returns a session token stored in `sessionStorage`
- **Role-based access control** — `ProtectedRoute` component enforces Admin/Employee/User roles on every page
- **Route protection** — Unauthenticated users are always redirected to `/login`
- **CORS configured** — Backend allows requests from `localhost:3000`
