from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models
import llm_router
import routing_engine
from rag_engine import RAGService
from pydantic import BaseModel
from typing import List
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import os

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Intelligent IT Support System")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG Service
rag_service = RAGService()

class TicketCreate(BaseModel):
    title: str
    description: str

@app.get("/", response_class=HTMLResponse)
def read_root():
    with open("index.html", "r") as f:
        return f.read()

@app.post("/tickets")
def create_ticket(ticket_in: TicketCreate, db: Session = Depends(get_db)):
    # 1. Store initial ticket
    db_ticket = models.Ticket(title=ticket_in.title, description=ticket_in.description)
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)

    # 2. LLM Analysis
    full_text = f"Title: {ticket_in.title}\nDescription: {ticket_in.description}"
    analysis = llm_router.analyze_ticket(full_text)
    
    if not analysis:
        # Fallback if AI fails (Triage as General Support)
        print("Warning: AI analysis failed. Falling back to default triage.")
        analysis = llm_router.TicketAnalysis(
            category="General Support",
            subcategory="Manual Triage Required",
            severity=3,
            urgency=3,
            required_skills=["general-support"],
            is_common_issue=False,
            summary="AI classification failed. Categorized as general support."
        )

    # 3. Routing
    agent = routing_engine.assign_ticket(db, db_ticket, analysis)
    
    # 4. RAG Auto-resolution (Optional Suggestion)
    resolution_suggestion = None
    if analysis.is_common_issue or analysis.severity < 4:
        try:
            resolution_suggestion = rag_service.resolve_ticket(full_text)
        except Exception as e:
            print(f"RAG Error: {e}")
            resolution_suggestion = "Could not generate automated resolution."

    return {
        "ticket_id": db_ticket.id,
        "analysis": analysis,
        "assigned_agent_name": agent.name if agent else "Unassigned",
        "priority_score": db_ticket.priority_score,
        "resolution_suggestion": resolution_suggestion
    }

@app.get("/employees")
def get_employees(db: Session = Depends(get_db)):
    return db.query(models.Employee).all()

@app.get("/tickets")
def get_tickets(db: Session = Depends(get_db)):
    tickets = db.query(models.Ticket).all()
    result = []
    for t in tickets:
        result.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "subcategory": t.subcategory,
            "severity": t.severity,
            "urgency": t.urgency,
            "priority_score": t.priority_score,
            "status": t.status,
            "assigned_agent_name": t.assigned_agent.name if t.assigned_agent else "Unassigned"
        })
    return result

@app.post("/tickets/{ticket_id}/resolve")
def resolve_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if ticket.status == "resolved":
        return {"message": "Ticket already resolved"}

    if ticket.assigned_employee_id:
        agent = db.query(models.Employee).filter(models.Employee.id == ticket.assigned_employee_id).first()
        if agent:
            agent.current_load = max(0, agent.current_load - 1)

    ticket.status = "resolved"
    db.commit()
    return {"message": "Ticket resolved and agent load updated"}

if __name__ == "__main__":
    # import uvicorn
    # uvicorn.run(app, host="0.0.0.0", port=8000)
    print("\n--- IT Ticket Solver Terminal ---")
    
    from database import SessionLocal
    import models
    import llm_router
    import routing_engine
    
    db = SessionLocal()
    try:
        while True:
            try:
                print("\nEnter Ticket Details (or Ctrl+C to exit):")
                title = input("Title: ")
                if not title.strip():
                    continue
                description = input("Description: ")
                
                db_ticket = models.Ticket(title=title, description=description)
                db.add(db_ticket)
                db.commit()
                db.refresh(db_ticket)
                
                full_text = f"Title: {title}\nDescription: {description}"
                analysis = llm_router.analyze_ticket(full_text)
                
                if not analysis:
                    print("Warning: AI analysis failed. Falling back to default triage.")
                    analysis = llm_router.TicketAnalysis(
                        category="General Support",
                        subcategory="Manual Triage Required",
                        severity=3,
                        urgency=3,
                        required_skills=["general-support"],
                        is_common_issue=False,
                        summary="AI classification failed. Categorized as general support."
                    )
                    
                agent = routing_engine.assign_ticket(db, db_ticket, analysis)
                
                print("\n--- Ticket Assignment ---")
                print(f"Ticket ID: {db_ticket.id}")
                print(f"Assigned Employee: {agent.name if agent else 'Unassigned'}")
                if agent:
                     print(f"Role: {agent.role}, Team: {agent.team}")
                print(f"Category: {analysis.category}")
                print(f"Subcategory: {analysis.subcategory}")
                print(f"Severity: {analysis.severity}, Urgency: {analysis.urgency}")
                print(f"Summary: {analysis.summary}")
            except EOFError:
                break
    except KeyboardInterrupt:
        print("\nExiting...")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()
