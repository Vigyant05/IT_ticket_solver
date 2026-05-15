"""
Unified IT Ticket Solver Server
================================
Combines the REST API (for the frontend dashboard) and the LangGraph AI
routing pipeline into a single FastAPI application running on port 8000.

Endpoints:
  - /api/*          → Frontend: Auth, tickets, employees, stats
  - /submit_ticket  → AI pipeline: classify ticket and route to Action / FAQ / Complex
  - /               → Health check
"""

import os
import sys
import secrets
import requests
from typing import TypedDict, Optional, Dict, Any, List
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uvicorn

# ── LangGraph ──────────────────────────────────────────────────────────────
from langgraph.graph import StateGraph, END

# ── Dynamic imports for pipeline sub-paths ─────────────────────────────────
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(CURRENT_DIR, "ai_router_agent"))
sys.path.append(os.path.join(CURRENT_DIR, "action_path"))
sys.path.append(os.path.join(CURRENT_DIR, "complex_path"))

# 1. AI Router
try:
    from router_agent import _build_client as build_router_client, classify_ticket
    router_client = build_router_client()
    ROUTER_AVAILABLE = True
except Exception as e:
    print(f"[Warning] AI Router not available: {e}")
    ROUTER_AVAILABLE = False
    router_client = None

# 2. Action Path (n8n)
try:
    from action_pipeline import send_ticket_to_n8n, DEFAULT_WEBHOOK_URL
    ACTION_AVAILABLE = True
except Exception as e:
    print(f"[Warning] Action Path not available: {e}")
    ACTION_AVAILABLE = False
    DEFAULT_WEBHOOK_URL = ""

# 3. Complex Path (DB + LLM routing)
# All imported directly via PYTHONPATH=complex_path — only one import path,
# which prevents SQLAlchemy's "Table already defined" error.
try:
    from database import SessionLocal, engine, Base
    import models
    import llm_router
    import routing_engine
    Base.metadata.create_all(bind=engine)
    COMPLEX_AVAILABLE = True
except Exception as e:
    print(f"[Warning] Complex Path not available: {e}")
    COMPLEX_AVAILABLE = False
    SessionLocal = None
    models = None

# ── RAG Path URL (run rag_path/app.py separately on port 8002) ─────────────
RAG_API_URL = os.getenv("RAG_API_URL", "http://localhost:8002")



# ===========================================================================
# FastAPI App
# ===========================================================================
app = FastAPI(
    title="IT Ticket Solver — Unified API",
    description="Frontend REST API + LangGraph AI Routing Pipeline",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory session store ─────────────────────────────────────────────────
active_sessions: dict[str, dict] = {}


# ===========================================================================
# Pydantic Schemas
# ===========================================================================

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str  # 'User', 'Employee', 'Admin'

class LoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None
    user: Optional[dict] = None
    message: Optional[str] = None

class TicketCreate(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    subcategory: Optional[str] = None

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    severity: Optional[int] = None
    urgency: Optional[int] = None

class PipelineTicketRequest(BaseModel):
    ticket_id: str = "TKT-001"
    ticket_text: str
    requester_name: Optional[str] = "Unknown User"
    requester_id: Optional[int] = None

class MessageRequest(BaseModel):
    ticket_id: Optional[int] = None
    sender_id: str
    receiver_id: Optional[str] = None
    sender_name: str
    content: str


# ===========================================================================
# DB Dependency
# ===========================================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ===========================================================================
# LangGraph Pipeline (Brain)
# ===========================================================================

class TicketState(TypedDict):
    ticket_id: str
    ticket_text: str
    db_ticket_id: Optional[int]
    intent: Optional[str]
    resolution: Optional[Dict[str, Any]]
    status: str
    # ── Telemetry fields ──────────────────────────────────────────────
    initial_intent:     Optional[str]         # RPI: frozen at classify_node
    cgr_context_tokens: Optional[int]         # CGR: tokens from retrieved context
    cgr_total_tokens:   Optional[int]         # CGR: total tokens in response
    sse_distances:      Optional[List[float]] # SSE: top-K ChromaDB distances
    sse_confidence:     Optional[float]       # SSE: heuristic confidence [0.0–1.0]


def classify_node(state: TicketState) -> TicketState:
    """AI Router: classifies the ticket as Action, FAQ, or Complex."""
    print(f"\n[Brain] Analysing ticket '{state['ticket_id']}'...")
    if ROUTER_AVAILABLE:
        intent = classify_ticket(router_client, state["ticket_text"])
    else:
        intent = "Complex"  # safe fallback
    state["intent"] = intent
    state["initial_intent"] = intent   # ← frozen snapshot for RPI (never overwritten)
    print(f"[Brain] Intent → {intent}")
    return state


def action_node(state: TicketState) -> TicketState:
    """Action Path: forwards ticket to n8n automation."""
    print("[Brain] → Action Path (n8n)")
    if ACTION_AVAILABLE:
        success, answer = send_ticket_to_n8n(state["ticket_text"], DEFAULT_WEBHOOK_URL)
    else:
        success = False
        answer = "Action path not available."
    state["resolution"] = {
        "path": "Action",
        "n8n_success": success,
        "answer": answer,
        "message": "Ticket forwarded to n8n automation workflow.",
    }
    state["status"] = "action_path_resolved"
    return state


def faq_node(state: TicketState) -> TicketState:
    """FAQ Path: queries the RAG knowledge base (running on port 8002)."""
    print("[Brain] → FAQ Path (RAG)")
    try:
        response = requests.post(
            f"{RAG_API_URL}/query",
            json={"question": state["ticket_text"]},
            timeout=60,
        )
        response.raise_for_status()
        rag_data = response.json()

        context_text = rag_data.get("retrieved_context", "")
        answer_text  = rag_data.get("generated_answer", "No answer generated.")
        llm_used     = rag_data.get("llm_used", False)
        metrics      = rag_data.get("metrics", {})

        # ── CGR: word-level token approximation ───────────────────────
        ctx_words   = len(context_text.split())
        total_words = len((context_text + " " + answer_text).split())
        state["cgr_context_tokens"] = ctx_words
        state["cgr_total_tokens"]   = max(total_words, 1)

        # ── SSE: distances + heuristic confidence ─────────────────────
        distances = metrics.get("distances", [])
        state["sse_distances"] = distances
        no_context = "No relevant past tickets" in context_text
        state["sse_confidence"] = 1.0 if (llm_used and not no_context) else 0.4

        state["resolution"] = {
            "path": "FAQ",
            "answer": answer_text,
            "context_used": llm_used,
            "rag_metrics": metrics,
        }
        state["status"] = "faq_resolved"
        print("[Brain] RAG answered successfully.")
    except Exception as e:
        print(f"[Brain] RAG API unreachable: {e}")
        state["resolution"] = {
            "path": "FAQ",
            "error": f"RAG knowledge base unreachable ({RAG_API_URL}). Ensure rag_path/app.py is running on port 8002.",
        }
        state["status"] = "failed_faq"
        # Zero-out telemetry on failure
        state["cgr_context_tokens"] = 0
        state["cgr_total_tokens"]   = 1
        state["sse_distances"]      = []
        state["sse_confidence"]     = 0.0
    return state


def complex_node(state: TicketState) -> TicketState:
    """Complex Path: saves ticket to DB and assigns to best human expert."""
    print("[Brain] → Complex Path (Human Expert Routing)")
    if not COMPLEX_AVAILABLE:
        state["resolution"] = {"path": "Complex", "error": "Complex path not available."}
        state["status"] = "failed_complex"
        return state

    db = SessionLocal()
    try:
        # Use the DB ticket created by /submit_ticket if available, else create new
        if state.get("db_ticket_id"):
            db_ticket = db.query(models.Ticket).filter(
                models.Ticket.id == state["db_ticket_id"]
            ).first()
        if not state.get("db_ticket_id") or not db_ticket:
            db_ticket = models.Ticket(
                title=f"Ticket {state['ticket_id']}",
                description=state["ticket_text"],
                requester_name="Unknown User"
            )
            db.add(db_ticket)
            db.commit()
            db.refresh(db_ticket)

        # LLM analysis
        full_text = f"Title: {db_ticket.title}\nDescription: {state['ticket_text']}"
        analysis = llm_router.analyze_ticket(full_text)
        if not analysis:
            analysis = llm_router.TicketAnalysis(
                category="General Support", subcategory="Triage", severity=3, urgency=3,
                required_skills=["general"], is_common_issue=False, summary="Fallback Analysis",
            )

        # Route to best agent
        agent = routing_engine.assign_ticket(db, db_ticket, analysis)
        state["resolution"] = {
            "path": "Complex",
            "db_ticket_id": db_ticket.id,
            "assigned_agent": agent.name if agent else "Unassigned",
            "assigned_employee_id": agent.id if agent else None,
            "severity": analysis.severity,
            "required_skills": analysis.required_skills,
        }
        state["status"] = "assigned_complex"
        print(f"[Brain] Assigned to: {state['resolution']['assigned_agent']}")
    except Exception as e:
        print(f"[Brain] Complex routing failed: {e}")
        state["resolution"] = {"path": "Complex", "error": str(e)}
        state["status"] = "failed_complex"
    finally:
        db.close()
    return state


def route_intent(state: TicketState) -> str:
    intent = state.get("intent", "Complex")
    if intent == "Action":
        return "action_node"
    elif intent == "FAQ":
        return "faq_node"
    return "complex_node"


# Compile LangGraph brain
workflow = StateGraph(TicketState)
workflow.add_node("classify_node", classify_node)
workflow.add_node("action_node", action_node)
workflow.add_node("faq_node", faq_node)
workflow.add_node("complex_node", complex_node)
workflow.set_entry_point("classify_node")
workflow.add_conditional_edges(
    "classify_node", route_intent,
    {"action_node": "action_node", "faq_node": "faq_node", "complex_node": "complex_node"},
)
workflow.add_edge("action_node", END)
workflow.add_edge("faq_node", END)
workflow.add_edge("complex_node", END)
brain = workflow.compile()


# ===========================================================================
# Pipeline Endpoint
# ===========================================================================

@app.post("/submit_ticket")
def submit_ticket(req: PipelineTicketRequest, db: Session = Depends(get_db)):
    """
    Receives a ticket, saves it to the database, then runs it through the
    LangGraph AI pipeline (classify → Action / FAQ / Complex).
    """
    # Save to DB first so Complex path can reference it
    db_ticket = models.Ticket(
        title=req.ticket_text[:50] + ("..." if len(req.ticket_text) > 50 else ""),
        description=req.ticket_text,
        requester_name=req.requester_name,
        requester_id=req.requester_id,
        status="open",
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)

    initial_state: TicketState = {
        "ticket_id": req.ticket_id,
        "ticket_text": req.ticket_text,
        "db_ticket_id": db_ticket.id,
        "intent": None,
        "resolution": None,
        "status": "received",
        # telemetry — populated by nodes
        "initial_intent": None,
        "cgr_context_tokens": None,
        "cgr_total_tokens": None,
        "sse_distances": None,
        "sse_confidence": None,
    }

    try:
        final_state = brain.invoke(initial_state)

        # The complex_node uses its own DB session, so our db_ticket is stale.
        # Expire + refresh forces SQLite to re-read the row from disk.
        db.expire(db_ticket)
        db.refresh(db_ticket)

        # Update ticket metadata from pipeline result
        resolution_dict = final_state.get("resolution", {})
        db_ticket.pipeline_path = resolution_dict.get("path")
        db_ticket.resolution_notes = resolution_dict.get("answer") or resolution_dict.get("message")

        # Explicitly set assigned_employee_id from resolution (belt-and-suspenders)
        if resolution_dict.get("assigned_employee_id") and not db_ticket.assigned_employee_id:
            db_ticket.assigned_employee_id = resolution_dict["assigned_employee_id"]

        # Only override status if complex_node didn't already set "assigned"
        if db_ticket.status not in ("assigned", "pending_assignment"):
            db_ticket.status = final_state.get("status", "open")

        # ── Persist telemetry ─────────────────────────────────────────
        SSE_THRESHOLD = 0.8

        db_ticket.initial_intent = final_state.get("initial_intent")

        ctx_tokens   = final_state.get("cgr_context_tokens") or 0
        total_tokens = final_state.get("cgr_total_tokens") or 1
        db_ticket.cgr_score = round(ctx_tokens / total_tokens, 4) if total_tokens > 0 else None

        distances  = final_state.get("sse_distances") or []
        confidence = final_state.get("sse_confidence") or 0.0
        db_ticket.sse_distances = distances
        if distances:
            avg_dist = sum(distances) / len(distances)
            db_ticket.sse_score = round((1 - avg_dist / SSE_THRESHOLD) * confidence, 4)
        # ─────────────────────────────────────────────────────────────

        db.commit()

        return {
            "success": True,
            "db_ticket_id": db_ticket.id,
            "intent_classified": final_state["intent"],
            "resolution": final_state["resolution"],
            "pipeline_status": final_state["status"],
        }
    except Exception as e:
        db_ticket.status = "open"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================================================
# AI Telemetry Metrics Endpoint
# ===========================================================================

import sys as _sys
import os as _os
_sys.path.insert(0, _os.path.dirname(__file__))  # ensure telemetry.py is found
from telemetry import TelemetryEngine

@app.get("/api/metrics")
def get_ai_metrics(hlo_days: int = 30, db: Session = Depends(get_db)):
    """
    Returns the 4 AI telemetry metrics for the Admin Insights panel.
    - CGR: Context Grounding Ratio
    - RPI: Routing Precision Index
    - HLO: Human Labor Offset (configurable window via ?hlo_days=N)
    - SSE: Semantic Search Efficiency
    """
    engine = TelemetryEngine(db)
    return engine.compute_all(hlo_days=hlo_days)


# ===========================================================================
# Authentication Endpoints
# ===========================================================================

@app.post("/api/login", response_model=LoginResponse)
def login(login_req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return a session token."""
    employee = db.query(models.Employee).filter(
        models.Employee.email == login_req.email
    ).first()

    if not employee or employee.password != login_req.password:
        return LoginResponse(success=False, message="Invalid email or password")

    role_mapping = {
        "Admin": ["Admin"],
        "Employee": [
            "Associate", "Specialist", "Senior Engineer", "Architect",
            "DevOps Engineer", "Cloud Architect", "SRE", "Cloud Engineer",
            "Security Analyst", "Security Specialist", "Penetration Tester",
            "Security Engineer",
        ],
        "User": ["User"],
    }

    valid_roles = role_mapping.get(login_req.role, [])
    if employee.role not in valid_roles:
        return LoginResponse(
            success=False,
            message=f"Cannot login as {login_req.role}. Your role is {employee.role}",
        )

    token = secrets.token_urlsafe(32)
    active_sessions[token] = {
        "id": employee.id,
        "email": employee.email,
        "name": employee.name,
        "role": employee.role,
        "team": employee.team,
    }

    return LoginResponse(
        success=True,
        token=token,
        user=active_sessions[token],
        message="Login successful",
    )


@app.post("/api/logout")
def logout(token: str):
    """Invalidate session token."""
    active_sessions.pop(token, None)
    return {"success": True, "message": "Logged out successfully"}


@app.get("/api/me")
def get_me(token: str):
    """Return current user info from token."""
    if token not in active_sessions:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"user": active_sessions[token]}


# ===========================================================================
# Admin Endpoints
# ===========================================================================

@app.get("/api/admin/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    """Live dashboard statistics for admin."""
    total_tickets = db.query(models.Ticket).count()
    open_tickets  = db.query(models.Ticket).filter(models.Ticket.status.in_(["open", "failed_faq", "failed_complex", "received"])).count()
    in_progress   = db.query(models.Ticket).filter(models.Ticket.status.in_(["in_progress", "assigned", "assigned_complex", "pending_assignment"])).count()
    resolved      = db.query(models.Ticket).filter(models.Ticket.status.in_(["resolved", "faq_resolved", "action_path_resolved", "complex_path_resolved", "closed"])).count()
    total_employees = db.query(models.Employee).filter(
        models.Employee.role != "User",
        models.Employee.role != "Admin",
    ).count()

    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "in_progress": in_progress,
        "resolved": resolved,
        "total_employees": total_employees,
    }


@app.get("/api/admin/tickets")
def get_all_tickets(db: Session = Depends(get_db)):
    """All tickets for admin view."""
    tickets = db.query(models.Ticket).order_by(models.Ticket.created_at.desc()).all()
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "subcategory": t.subcategory,
            "severity": t.severity,
            "urgency": t.urgency,
            "priority_score": t.priority_score,
            "status": t.status,
            "assigned_employee_id": t.assigned_employee_id,
            "assigned_agent_name": t.assigned_agent.name if t.assigned_agent else "Unassigned",
            "requester_name": t.requester_name,
            "resolution_notes": t.resolution_notes,
            "pipeline_path": t.pipeline_path,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in tickets
    ]


@app.get("/api/admin/employees")
def get_all_employees(db: Session = Depends(get_db)):
    """Staff directory (excludes Users and Admin)."""
    employees = db.query(models.Employee).filter(
        models.Employee.role != "User",
        models.Employee.role != "Admin",
    ).all()
    return [
        {
            "id": e.id,
            "name": e.name,
            "email": e.email,
            "role": e.role,
            "team": e.team,
            "expertise_tags": e.expertise_tags or [],
            "skill_level": e.skill_level,
            "current_load": e.current_load,
            "availability_status": e.availability_status,
        }
        for e in employees
    ]


# ===========================================================================
# Employee Endpoints
# ===========================================================================

@app.get("/api/employee/{employee_id}")
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """Get a single employee's profile."""
    emp = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {
        "id": emp.id,
        "name": emp.name,
        "email": emp.email,
        "role": emp.role,
        "team": emp.team,
        "expertise_tags": emp.expertise_tags or [],
        "skill_level": emp.skill_level,
        "current_load": emp.current_load,
        "availability_status": emp.availability_status,
        "avg_resolution_time": emp.avg_resolution_time,
        "priority_handling_capability": emp.priority_handling_capability,
    }


@app.get("/api/employee/{employee_id}/tickets")
def get_employee_tickets(employee_id: int, status: Optional[str] = None, db: Session = Depends(get_db)):
    """Tickets assigned to a specific employee."""
    query = db.query(models.Ticket).filter(models.Ticket.assigned_employee_id == employee_id)
    if status:
        query = query.filter(models.Ticket.status == status)
    tickets = query.order_by(models.Ticket.created_at.desc()).all()
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "subcategory": t.subcategory,
            "severity": t.severity,
            "urgency": t.urgency,
            "priority_score": t.priority_score,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in tickets
    ]


# ===========================================================================
# Ticket CRUD Endpoints
# ===========================================================================

@app.post("/api/tickets")
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    """Create a ticket (simple, no AI routing). Use /submit_ticket for AI routing."""
    db_ticket = models.Ticket(
        title=ticket.title,
        description=ticket.description,
        category=ticket.category,
        subcategory=ticket.subcategory,
        status="open",
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return {"success": True, "ticket_id": db_ticket.id, "message": "Ticket created successfully"}


@app.put("/api/ticket/{ticket_id}/resolve")
def resolve_ticket(ticket_id: int, db: Session = Depends(get_db)):
    """Mark a ticket as resolved and decrement agent load, capturing last message as resolution note."""
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.status = "complex_path_resolved"
    ticket.resolved_at = datetime.utcnow()

    # Capture the last message as the resolution note
    last_message = db.query(models.ChatMessage).filter(
        models.ChatMessage.ticket_id == ticket_id
    ).order_by(models.ChatMessage.timestamp.desc()).first()
    
    if last_message:
        ticket.resolution_notes = f"Resolved by {last_message.sender_name}:\n{last_message.content}"
    else:
        ticket.resolution_notes = "Ticket resolved by assigned agent."

    if ticket.assigned_employee_id:
        emp = db.query(models.Employee).filter(models.Employee.id == ticket.assigned_employee_id).first()
        if emp:
            emp.current_load = max(0, emp.current_load - 1)

    db.commit()
    return {"success": True, "message": "Ticket resolved", "ticket_id": ticket_id}


@app.get("/api/user/{user_id}/tickets")
def get_user_tickets(user_id: int, db: Session = Depends(get_db)):
    """Tickets raised by a specific user."""
    tickets = db.query(models.Ticket).filter(models.Ticket.requester_id == user_id).order_by(models.Ticket.created_at.desc()).all()
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "subcategory": t.subcategory,
            "severity": t.severity,
            "urgency": t.urgency,
            "priority_score": t.priority_score,
            "status": t.status,
            "assigned_agent_name": t.assigned_agent.name if t.assigned_agent else "Unassigned",
            "assigned_employee_id": t.assigned_employee_id,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
            "pipeline_path": t.pipeline_path,
        }
        for t in tickets
    ]

@app.get("/api/ticket/{ticket_id}")
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    """Get a single ticket's details."""
    t = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "category": t.category,
        "subcategory": t.subcategory,
        "severity": t.severity,
        "urgency": t.urgency,
        "priority_score": t.priority_score,
        "status": t.status,
        "assigned_employee_id": t.assigned_employee_id,
        "assigned_agent_name": t.assigned_agent.name if t.assigned_agent else "Unassigned",
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
        "resolution_notes": t.resolution_notes,
    }

@app.put("/api/ticket/{ticket_id}")
def update_ticket(ticket_id: int, update: TicketUpdate, db: Session = Depends(get_db)):
    """Update ticket fields."""
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if update.status:    ticket.status = update.status
    if update.category:  ticket.category = update.category
    if update.subcategory: ticket.subcategory = update.subcategory
    if update.severity:  ticket.severity = update.severity
    if update.urgency:   ticket.urgency = update.urgency

    db.commit()
    db.refresh(ticket)
    return {"success": True, "ticket_id": ticket_id}


@app.delete("/api/ticket/{ticket_id}")
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    """Delete a ticket."""
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Also decrement agent load if ticket was assigned and not resolved
    if ticket.assigned_employee_id and ticket.status not in ["resolved", "closed"]:
        emp = db.query(models.Employee).filter(models.Employee.id == ticket.assigned_employee_id).first()
        if emp:
            emp.current_load = max(0, emp.current_load - 1)
            
    db.delete(ticket)
    db.commit()
    return {"success": True, "message": "Ticket deleted"}



# ===========================================================================
# User Endpoints
# ===========================================================================

@app.get("/api/user/tickets")
def get_user_tickets(db: Session = Depends(get_db)):
    open_count = db.query(models.Ticket).filter(models.Ticket.status == "open").count()
    return {"open_tickets_count": open_count}


# ===========================================================================
# Messaging Endpoints
# ===========================================================================

@app.post("/api/messages")
def send_message(msg: MessageRequest, db: Session = Depends(get_db)):
    db_msg = models.ChatMessage(
        ticket_id=msg.ticket_id,
        sender_id=msg.sender_id,
        receiver_id=msg.receiver_id,
        sender_name=msg.sender_name,
        content=msg.content
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return {
        "id": db_msg.id,
        "content": db_msg.content,
        "sender_name": db_msg.sender_name,
        "timestamp": db_msg.timestamp.isoformat()
    }

@app.get("/api/messages")
def get_messages(
    ticket_id: Optional[int] = None, 
    user1: Optional[str] = None, 
    user2: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    query = db.query(models.ChatMessage)
    if ticket_id:
        query = query.filter(models.ChatMessage.ticket_id == ticket_id)
    elif user1 and user2:
        query = query.filter(
            ((models.ChatMessage.sender_id == user1) & (models.ChatMessage.receiver_id == user2)) |
            ((models.ChatMessage.sender_id == user2) & (models.ChatMessage.receiver_id == user1))
        )
    elif user1:
        query = query.filter(
            (models.ChatMessage.sender_id == user1) | (models.ChatMessage.receiver_id == user1)
        )
    messages = query.order_by(models.ChatMessage.timestamp.asc()).all()
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "sender_name": m.sender_name,
            "content": m.content,
            "timestamp": m.timestamp.isoformat(),
            "ticket_id": m.ticket_id
        } for m in messages
    ]


# ===========================================================================
# Health Check
# ===========================================================================

@app.get("/")
def root():
    return {
        "message": "IT Ticket Solver — Unified API is running.",
        "frontend_api": "http://localhost:8000/api/*",
        "ai_pipeline": "POST http://localhost:8000/submit_ticket",
        "rag_path": f"{RAG_API_URL} (run rag_path/app.py separately)",
        "docs": "http://localhost:8000/docs",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "router_available": ROUTER_AVAILABLE,
        "action_available": ACTION_AVAILABLE,
        "complex_available": COMPLEX_AVAILABLE,
    }


# ===========================================================================
# Entry Point
# ===========================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("  IT Ticket Solver — Unified Server")
    print("=" * 60)
    print(f"  Frontend API  → http://localhost:8000/api/")
    print(f"  AI Pipeline   → POST http://localhost:8000/submit_ticket")
    print(f"  Swagger Docs  → http://localhost:8000/docs")
    print(f"  RAG Path      → run 'uvicorn app:app --port 8002' in rag_path/")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000)
