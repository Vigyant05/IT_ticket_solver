"""
FastAPI Backend for IT Ticket Solver
Provides authentication and REST API for frontend integration
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import secrets

# Import database and models
from complex_path.database import SessionLocal, engine, Base
from complex_path import models

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="IT Ticket Solver API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory session store (for development)
# In production, use Redis or JWT tokens
active_sessions: dict[str, dict] = {}


# ============== Pydantic Schemas ==============

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

class EmployeeResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    team: str
    expertise_tags: list
    skill_level: int
    current_load: int
    availability_status: bool

class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    category: Optional[str]
    subcategory: Optional[str]
    severity: Optional[int]
    urgency: Optional[int]
    priority_score: Optional[float]
    status: str
    assigned_employee_id: Optional[int]
    assigned_agent_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============== Dependencies ==============

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_token(token: str) -> dict:
    """Verify session token and return user info"""
    if token not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    return active_sessions[token]

async def get_current_user(token: str = Depends(lambda: None)) -> Optional[dict]:
    """Get current user from token - simplified for now"""
    return None


# ============== Authentication Endpoints ==============

@app.post("/api/login", response_model=LoginResponse)
def login(login_req: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return session token
    """
    # Query employee by email
    employee = db.query(models.Employee).filter(
        models.Employee.email == login_req.email
    ).first()

    if not employee:
        return LoginResponse(
            success=False,
            message="Invalid email or password"
        )

    # Check password (plain text for now, should be hashed in production)
    if employee.password != login_req.password:
        return LoginResponse(
            success=False,
            message="Invalid email or password"
        )

    # Check role match
    role_mapping = {
        'Admin': 'Admin',
        'Employee': ['Associate', 'Specialist', 'Senior Engineer', 'Architect', 'DevOps Engineer', 'Cloud Architect', 'SRE', 'Cloud Engineer', 'Security Analyst', 'Security Specialist', 'Penetration Tester', 'Security Engineer'],
        'User': ['User']
    }

    user_role = employee.role
    requested_role = login_req.role

    is_valid_role = (
        user_role == requested_role or
        (requested_role == 'Employee' and user_role in role_mapping['Employee']) or
        (requested_role == 'Admin' and user_role == 'Admin')
    )

    if not is_valid_role:
        return LoginResponse(
            success=False,
            message=f"Cannot login as {requested_role}. Your role is {user_role}"
        )

    # Generate session token
    token = secrets.token_urlsafe(32)

    # Store session
    active_sessions[token] = {
        "id": employee.id,
        "email": employee.email,
        "name": employee.name,
        "role": employee.role,
        "team": employee.team
    }

    return LoginResponse(
        success=True,
        token=token,
        user={
            "id": employee.id,
            "email": employee.email,
            "name": employee.name,
            "role": employee.role,
            "team": employee.team
        },
        message="Login successful"
    )


@app.post("/api/logout")
def logout(token: str):
    """Invalidate session token"""
    if token in active_sessions:
        del active_sessions[token]
        return {"success": True, "message": "Logged out successfully"}
    return {"success": True, "message": "Already logged out"}


@app.get("/api/me")
def get_current_user_info(token: str):
    """Get current authenticated user info"""
    if token not in active_sessions:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"user": active_sessions[token]}


# ============== Admin Endpoints ==============

@app.get("/api/admin/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics for admin"""
    total_tickets = db.query(models.Ticket).count()
    open_tickets = db.query(models.Ticket).filter(
        models.Ticket.status == "open"
    ).count()
    in_progress = db.query(models.Ticket).filter(
        models.Ticket.status == "in_progress"
    ).count()
    resolved = db.query(models.Ticket).filter(
        models.Ticket.status == "resolved"
    ).count()

    total_employees = db.query(models.Employee).filter(
        models.Employee.role != "User",
        models.Employee.role != "Admin"
    ).count()

    assigned = db.query(models.Ticket).filter(
        models.Ticket.status == "assigned"
    ).count()

    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "in_progress": in_progress + assigned,
        "resolved": resolved,
        "total_employees": total_employees
    }


@app.get("/api/admin/tickets")
def get_all_tickets(db: Session = Depends(get_db)):
    """Get all tickets for admin view"""
    tickets = db.query(models.Ticket).order_by(
        models.Ticket.created_at.desc()
    ).all()

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
            "assigned_employee_id": t.assigned_employee_id,
            "assigned_agent_name": t.assigned_agent.name if t.assigned_agent else "Unassigned",
            "created_at": t.created_at.isoformat() if t.created_at else None
        })
    return result


@app.get("/api/admin/employees")
def get_all_employees(db: Session = Depends(get_db)):
    """Get all employees (excluding Users and Admin) for admin view"""
    employees = db.query(models.Employee).filter(
        models.Employee.role != "User",
        models.Employee.role != "Admin"
    ).all()

    result = []
    for e in employees:
        result.append({
            "id": e.id,
            "name": e.name,
            "email": e.email,
            "role": e.role,
            "team": e.team,
            "expertise_tags": e.expertise_tags or [],
            "skill_level": e.skill_level,
            "current_load": e.current_load,
            "availability_status": e.availability_status
        })
    return result


# ============== Employee Endpoints ==============

@app.get("/api/employee/{employee_id}/tickets")
def get_employee_tickets(employee_id: int, status: Optional[str] = None, db: Session = Depends(get_db)):
    """Get tickets assigned to specific employee"""
    query = db.query(models.Ticket).filter(
        models.Ticket.assigned_employee_id == employee_id
    )

    if status:
        query = query.filter(models.Ticket.status == status)

    tickets = query.order_by(models.Ticket.created_at.desc()).all()

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
            "created_at": t.created_at.isoformat() if t.created_at else None
        })
    return result


@app.get("/api/employee/{employee_id}")
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """Get employee details"""
    employee = db.query(models.Employee).filter(
        models.Employee.id == employee_id
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    return {
        "id": employee.id,
        "name": employee.name,
        "email": employee.email,
        "role": employee.role,
        "team": employee.team,
        "expertise_tags": employee.expertise_tags or [],
        "skill_level": employee.skill_level,
        "current_load": employee.current_load,
        "availability_status": employee.availability_status,
        "avg_resolution_time": employee.avg_resolution_time,
        "priority_handling_capability": employee.priority_handling_capability
    }


@app.put("/api/ticket/{ticket_id}/resolve")
def resolve_ticket(ticket_id: int, db: Session = Depends(get_db)):
    """Mark ticket as resolved"""
    ticket = db.query(models.Ticket).filter(
        models.Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.status = "resolved"
    ticket.resolved_at = datetime.utcnow()

    # Update employee load
    if ticket.assigned_employee_id:
        emp = db.query(models.Employee).filter(
            models.Employee.id == ticket.assigned_employee_id
        ).first()
        if emp:
            emp.current_load = max(0, emp.current_load - 1)

    db.commit()

    return {"success": True, "message": "Ticket resolved", "ticket_id": ticket_id}


@app.put("/api/ticket/{ticket_id}")
def update_ticket(ticket_id: int, update: TicketUpdate, db: Session = Depends(get_db)):
    """Update ticket details"""
    ticket = db.query(models.Ticket).filter(
        models.Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if update.status:
        ticket.status = update.status
    if update.category:
        ticket.category = update.category
    if update.subcategory:
        ticket.subcategory = update.subcategory
    if update.severity:
        ticket.severity = update.severity
    if update.urgency:
        ticket.urgency = update.urgency

    db.commit()
    db.refresh(ticket)

    return {"success": True, "ticket": ticket}


# ============== User Endpoints ==============

@app.get("/api/user/tickets")
def get_user_tickets(db: Session = Depends(get_db)):
    """
    Get tickets for regular users.
    Since users don't have assigned tickets, return recent open tickets or FAQ info
    """
    # For users, show their submitted tickets (if we had a requester field)
    # For now, return general ticket stats
    open_count = db.query(models.Ticket).filter(
        models.Ticket.status == "open"
    ).count()

    return {
        "message": "User tickets endpoint",
        "open_tickets_count": open_count
    }


@app.post("/api/tickets")
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    """Create a new ticket"""
    db_ticket = models.Ticket(
        title=ticket.title,
        description=ticket.description,
        category=ticket.category,
        subcategory=ticket.subcategory,
        status="open"
    )

    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)

    return {
        "success": True,
        "ticket_id": db_ticket.id,
        "message": "Ticket created successfully"
    }


# ============== Chatbot Endpoint ==============

@app.post("/api/chat")
def chat_with_bot(message: str, db: Session = Depends(get_db)):
    """Simple chatbot response - integrate with RAG later"""
    # This is a placeholder - integrate with the existing RAG system
    return {
        "response": f"Received: {message}. This will be connected to the RAG system.",
        "suggestions": ["Check FAQ", "Create Ticket", "Contact Support"]
    }


# ============== Health Check ==============

@app.get("/api/health")
def health_check():
    """API health check"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    import uvicorn
    print("Starting IT Ticket Solver API...")
    print("API listening on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
