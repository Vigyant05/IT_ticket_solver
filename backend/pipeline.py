import os
import sys
import requests
from typing import TypedDict, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# LangGraph dependencies
from langgraph.graph import StateGraph, END

# --- Dynamic Imports for Sub-Paths ---
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(CURRENT_DIR, "ai_router_agent"))
sys.path.append(os.path.join(CURRENT_DIR, "action_path"))
sys.path.append(os.path.join(CURRENT_DIR, "complex_path"))

# 1. Import router logic
try:
    from router_agent import _build_client as build_router_client, classify_ticket
except ImportError as e:
    print(f"Warning: Could not import ai_router_agent. Ensure dependencies are installed. ({e})")

# 2. Import action pipeline logic
try:
    from action_pipeline import send_ticket_to_n8n, DEFAULT_WEBHOOK_URL
except ImportError as e:
    print(f"Warning: Could not import action_path. ({e})")

# 3. Import complex path database and logic
try:
    from database import SessionLocal, engine, Base
    import models
    import llm_router
    import routing_engine
    # Ensure DB tables are created for complex path
    Base.metadata.create_all(bind=engine)
except ImportError as e:
    print(f"Warning: Could not import complex_path database. ({e})")

# ==========================================
# THE BRAIN: LangGraph State & Nodes
# ==========================================

# 1. Define the State
class TicketState(TypedDict):
    ticket_id: str
    ticket_text: str
    intent: Optional[str]
    resolution: Optional[Dict[str, Any]]
    status: str

# 2. Initialize Clients
router_client = build_router_client()

# 3. Define the Nodes
def classify_node(state: TicketState) -> TicketState:
    """AI Router Agent: Classifies the ticket into Action, FAQ, or Complex"""
    print(f"\n[Brain] Analyzing ticket '{state['ticket_id']}'...")
    intent = classify_ticket(router_client, state["ticket_text"])
    state["intent"] = intent
    print(f"[Brain] Intent Classified as: {intent}")
    return state

def action_node(state: TicketState) -> TicketState:
    """Action Path: Handles Action tickets by sending them to n8n"""
    print(f"[Brain] Routing to Action Path (n8n)...")
    success = send_ticket_to_n8n(state["ticket_text"], DEFAULT_WEBHOOK_URL)
    
    state["resolution"] = {
        "path": "Action",
        "n8n_success": success,
        "message": "Ticket forwarded to n8n automation workflow."
    }
    state["status"] = "in_progress_action"
    return state

def faq_node(state: TicketState) -> TicketState:
    """FAQ Path: Handles FAQ tickets by querying the RAG API"""
    print(f"[Brain] Routing to FAQ Path (RAG)...")
    try:
        # Assuming RAG Path API is running on port 8000
        response = requests.post("http://localhost:8000/query", json={"question": state["ticket_text"]}, timeout=60)
        response.raise_for_status()
        rag_data = response.json()
        
        state["resolution"] = {
            "path": "FAQ",
            "answer": rag_data.get("generated_answer", "No answer generated."),
            "context_used": rag_data.get("llm_used", False),
            "rag_metrics": rag_data.get("metrics", {})
        }
        state["status"] = "resolved_faq"
        print(f"[Brain] RAG generated an answer successfully.")
    except Exception as e:
        print(f"[Brain] RAG API failed: {e}")
        state["resolution"] = {
            "path": "FAQ",
            "error": "Failed to connect to RAG knowledge base. Ensure it is running on port 8000."
        }
        state["status"] = "failed_faq"
    return state

def complex_node(state: TicketState) -> TicketState:
    """Complex Path: Handles Complex tickets by logging to DB and assigning via Routing Engine"""
    print(f"[Brain] Routing to Complex Path (Human Expert)...")
    db = SessionLocal()
    try:
        # Step A: Save ticket
        db_ticket = models.Ticket(title=f"Ticket {state['ticket_id']}", description=state["ticket_text"])
        db.add(db_ticket)
        db.commit()
        db.refresh(db_ticket)
        
        # Step B: LLM Analysis (Extract skills & severity)
        full_text = f"Title: {db_ticket.title}\nDescription: {state['ticket_text']}"
        analysis = llm_router.analyze_ticket(full_text)
        
        # Fallback if analysis fails
        if not analysis:
            analysis = llm_router.TicketAnalysis(
                category="General Support", subcategory="Triage", severity=3, urgency=3,
                required_skills=["general"], is_common_issue=False, summary="Fallback Analysis"
            )
            
        # Step C: Assign via Routing Algorithm
        agent = routing_engine.assign_ticket(db, db_ticket, analysis)
        
        state["resolution"] = {
            "path": "Complex",
            "db_ticket_id": db_ticket.id,
            "assigned_agent": agent.name if agent else "Unassigned",
            "severity": analysis.severity,
            "required_skills": analysis.required_skills
        }
        state["status"] = "assigned_complex"
        print(f"[Brain] Assigned to Human Expert: {state['resolution']['assigned_agent']}")
    except Exception as e:
        print(f"[Brain] Complex routing failed: {e}")
        state["resolution"] = {"path": "Complex", "error": str(e)}
        state["status"] = "failed_complex"
    finally:
        db.close()
        
    return state

# 4. Define the Edges
def route_intent(state: TicketState) -> str:
    """Decides the next node based on the intent string"""
    intent = state.get("intent", "Complex") # Fallback to complex if missing
    if intent == "Action":
        return "action_node"
    elif intent == "FAQ":
        return "faq_node"
    else:
        return "complex_node"

# 5. Compile the Graph
workflow = StateGraph(TicketState)

workflow.add_node("classify_node", classify_node)
workflow.add_node("action_node", action_node)
workflow.add_node("faq_node", faq_node)
workflow.add_node("complex_node", complex_node)

workflow.set_entry_point("classify_node")

workflow.add_conditional_edges(
    "classify_node",
    route_intent,
    {
        "action_node": "action_node",
        "faq_node": "faq_node",
        "complex_node": "complex_node"
    }
)

workflow.add_edge("action_node", END)
workflow.add_edge("faq_node", END)
workflow.add_edge("complex_node", END)

brain_app = workflow.compile()


# ==========================================
# THE MOUTH: FastAPI Wrapper
# ==========================================
app = FastAPI(title="Unified IT Support Pipeline", description="LangGraph Brain + FastAPI Mouth")

class TicketRequest(BaseModel):
    ticket_id: str = "TKT-001"
    ticket_text: str

@app.post("/submit_ticket")
def submit_ticket(req: TicketRequest):
    """
    Mouth API: Receives a ticket from the frontend and feeds it into the LangGraph Brain.
    """
    initial_state = {
        "ticket_id": req.ticket_id,
        "ticket_text": req.ticket_text,
        "intent": None,
        "resolution": None,
        "status": "received"
    }
    
    try:
        # Execute the LangGraph pipeline
        final_state = brain_app.invoke(initial_state)
        
        return {
            "status": "success",
            "intent_classified": final_state["intent"],
            "resolution": final_state["resolution"],
            "workflow_status": final_state["status"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "LangGraph Unified Pipeline is running. POST to /submit_ticket to process a ticket."}

if __name__ == "__main__":
    print("Starting Unified Pipeline...")
    print("LangGraph Brain compiled successfully.")
    print("FastAPI Mouth listening on port 8080 (so it doesn't conflict with RAG path).")
    # Run on 8080 to prevent conflict with rag_path which usually runs on 8000
    uvicorn.run(app, host="0.0.0.0", port=8080)
