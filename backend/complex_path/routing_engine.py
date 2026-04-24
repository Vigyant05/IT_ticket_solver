from typing import List, Optional
from sqlalchemy.orm import Session
from models import Employee, Ticket
from llm_router import TicketAnalysis

# Scoring Weights
SKILL_MATCH_WEIGHT = 0.5
LOAD_WEIGHT = 0.3
PRIORITY_CAPABILITY_WEIGHT = 0.2

# Category to Team Mapping (Initial Strategy)
CATEGORY_TEAM_MAP = {
    "Infrastructure": ["L3 Infrastructure", "DevOps"],
    "Application": ["L2 Application"],
    "Security": ["Security"],
    "General Support": ["L1 Support"],
    "Network": ["L3 Infrastructure", "L1 Support"]
}

def calculate_priority(severity: int, urgency: int) -> float:
    return (severity * 0.6) + (urgency * 0.4)

def find_best_agent(db: Session, analysis: TicketAnalysis) -> Optional[Employee]:
    priority_score = calculate_priority(analysis.severity, analysis.urgency)
    
    # 1. Potential Teams
    target_teams = CATEGORY_TEAM_MAP.get(analysis.category, ["L1 Support"])
    
    # 2. Filter available employees
    candidates = db.query(Employee).filter(
        Employee.availability_status == True,
        Employee.team.in_(target_teams)
    ).all()
    
    if not candidates:
        # Fallback: All available employees if primary team is full/absent
        candidates = db.query(Employee).filter(Employee.availability_status == True).all()
    
    if not candidates:
        return None

    # 3. Scoring
    best_agent = None
    max_score = -999.0
    
    for agent in candidates:
        # Skill Match: Overlap of expertise_tags and required_skills
        overlap = len(set(agent.expertise_tags) & set(analysis.required_skills))
        skill_score = overlap / max(len(analysis.required_skills), 1)
        
        # Priority Capability mapping
        capability_map = {"High": 1.0, "Medium": 0.5, "Low": 0.0}
        priority_cap_score = capability_map.get(agent.priority_handling_capability, 0.0)
        
        if analysis.severity >= 4:
            # Critical ticket:
            # - Massive weight on skill and capability
            # - Very small load penalty so it assigns irrespective of workload
            # A perfect skill match is worth 20 tickets.
            score = (2.0 * skill_score) + (1.0 * priority_cap_score) - (0.1 * agent.current_load)
        else:
            # Normal ticket (severity < 4):
            # - Prevent overloading using a strong load penalty
            # - Invert priority cap to prefer assigning low-severity tickets to Low/Medium cap agents
            inverse_cap_map = {"Low": 1.0, "Medium": 0.5, "High": 0.0}
            inverted_cap_score = inverse_cap_map.get(agent.priority_handling_capability, 0.0)
            
            # A perfect skill match is worth exactly 2 tickets.
            # This ensures an expert never gets more than 2 tickets ahead of a non-expert.
            score = (2.0 * skill_score) + (0.5 * inverted_cap_score) - (1.0 * agent.current_load)
        
        if score > max_score:
            max_score = score
            best_agent = agent
            
    return best_agent

def assign_ticket(db: Session, ticket: Ticket, analysis: TicketAnalysis):
    best_agent = find_best_agent(db, analysis)
    
    ticket.category = analysis.category
    ticket.subcategory = analysis.subcategory
    ticket.severity = analysis.severity
    ticket.urgency = analysis.urgency
    ticket.priority_score = calculate_priority(analysis.severity, analysis.urgency)
    ticket.status = "assigned"

    if best_agent:
        ticket.assigned_employee_id = best_agent.id
        best_agent.current_load += 1
        db.commit()
        return best_agent
    else:
        ticket.status = "pending_assignment"
        db.commit()
        return None
