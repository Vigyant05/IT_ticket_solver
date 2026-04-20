import csv
import sys
import os

from database import SessionLocal
import models
import llm_router
import routing_engine

def run_evaluation():
    db = SessionLocal()
    dataset_path = '../../dataset/Complex/tickets_complex.csv'
    
    if not os.path.exists(dataset_path):
        print(f"Dataset not found at {dataset_path}")
        return

    with open(dataset_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader) # skip header
        count = 0
        for row in reader:
            if not row:
                continue
            if count >= 5:
                break
            ticket_text = row[0]
            # Use the first sentence or first 50 chars as the pseudo-title
            title = ticket_text.split('.')[0] if '.' in ticket_text else ticket_text[:50]
            description = ticket_text
            
            print(f"\n{'='*50}")
            print(f"--- TICKET {count+1} ---")
            print(f"Original Text (snip): {description[:100]}...")
            
            try:
                db_ticket = models.Ticket(title=title, description=description)
                db.add(db_ticket)
                db.commit()
                db.refresh(db_ticket)
                
                full_text = f"Title: {title}\nDescription: {description}"
                analysis = llm_router.analyze_ticket(full_text)
                
                if not analysis:
                    print("Warning: AI analysis failed.")
                    continue
                    
                agent = routing_engine.assign_ticket(db, db_ticket, analysis)
                
                print(f"\n[AI CLASSIFICATION]")
                print(f"Category: {analysis.category} | Subcategory: {analysis.subcategory}")
                print(f"Severity: {analysis.severity}/5 | Urgency: {analysis.urgency}/5")
                print(f"Required Skills: {analysis.required_skills}")
                print(f"Summary: {analysis.summary}")
                
                print(f"\n[ASSIGNMENT]")
                print(f"Assigned Employee: {agent.name if agent else 'UNASSIGNED'}")
                if agent:
                     print(f"Employee Details - Role: {agent.role}, Team: {agent.team}")
                     print(f"Employee Expertise: {agent.expertise_tags}")
                     print(f"Employee Workload: {agent.current_load}")
            except Exception as e:
                print(f"Error processing ticket: {e}")
            
            count += 1

if __name__ == "__main__":
    run_evaluation()
