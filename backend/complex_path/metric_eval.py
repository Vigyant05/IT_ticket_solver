import sys
import random
import argparse
import csv
import os
from database import SessionLocal
import models
from llm_router import TicketAnalysis, analyze_ticket
import routing_engine
from seed_data import seed_data

def generate_mock_analysis(index):
    # We will generate a mix of Critical/High Priority tickets and normal ones
    severity = random.choice([1, 2, 3, 4, 5])
    urgency = random.choice([1, 2, 3, 4, 5])
    
    categories = ["Infrastructure", "Application", "Security", "General Support", "Network"]
    skills_pool = {
        "Infrastructure": ["linux", "postgresql", "virtualization", "storage"],
        "Application": ["erp", "crm", "internal-tools", "e-commerce"],
        "Security": ["phishing", "iam", "vulnerability-scanning", "soc"],
        "General Support": ["windows", "hardware", "mac-os", "vpn"],
        "Network": ["basic-networking", "vpn", "wifi", "firewalls"]
    }
    
    category = random.choice(categories)
    required_skills = random.sample(skills_pool[category], k=min(2, len(skills_pool[category])))
    
    return TicketAnalysis(
        category=category,
        subcategory="Mock Subcategory",
        severity=severity,
        urgency=urgency,
        required_skills=required_skills,
        is_common_issue=False,
        summary=f"Mock ticket {index} for {category}"
    )

def run_metric_evaluation(num_tickets=50, mode="mock"):
    print(f"Reseeding database for clean evaluation state...")
    seed_data()
    
    db = SessionLocal()

    metrics = {
        "total_processed": 0,
        "successfully_assigned": 0,
        "skill_match_scores": [],
        "high_severity_to_high_priority_agent": 0,
        "high_severity_total": 0,
        "workload_distribution": {},
        "agent_severities": {}  # agent_name -> list of severities assigned
    }

    print(f"\n--- Starting Routing Evaluation for {num_tickets} {mode.upper()} Tickets ---\n")

    if mode == "real":
        dataset_path = '../../dataset/Complex/tickets_complex.csv'
        if not os.path.exists(dataset_path):
            print(f"Dataset not found at {dataset_path}")
            return
        
        with open(dataset_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader) # skip header
            real_tickets = []
            for row in reader:
                if row: real_tickets.append(row[0])
                if len(real_tickets) >= num_tickets: break
        
        if len(real_tickets) < num_tickets:
            print(f"Warning: Only found {len(real_tickets)} tickets in dataset.")
            num_tickets = len(real_tickets)

    for i in range(1, num_tickets + 1):
        if mode == "mock":
            title = f"Mock Ticket {i}"
            description = f"This is a mocked ticket to test load balancing."
            db_ticket = models.Ticket(title=title, description=description)
            db.add(db_ticket)
            db.commit()
            db.refresh(db_ticket)
            
            analysis = generate_mock_analysis(i)
        else:
            ticket_text = real_tickets[i-1]
            title = ticket_text.split('.')[0] if '.' in ticket_text else ticket_text[:50]
            description = ticket_text
            db_ticket = models.Ticket(title=title, description=description)
            db.add(db_ticket)
            db.commit()
            db.refresh(db_ticket)
            
            full_text = f"Title: {title}\nDescription: {description}"
            analysis = analyze_ticket(full_text)
            if not analysis:
                print(f"Ticket {i:02d}: AI analysis failed. Skipping metrics.")
                continue
        
        metrics["total_processed"] += 1
        if analysis.severity >= 4:
            metrics["high_severity_total"] += 1
            
        agent = routing_engine.assign_ticket(db, db_ticket, analysis)
        
        if agent:
            metrics["successfully_assigned"] += 1
            
            # Check skill match
            overlap = len(set(agent.expertise_tags) & set(analysis.required_skills))
            match_pct = (overlap / len(analysis.required_skills)) * 100 if analysis.required_skills else 100
            metrics["skill_match_scores"].append(match_pct)
            
            # Check severity vs capability
            if analysis.severity >= 4 and agent.priority_handling_capability in ['High', 'Medium']:
                metrics["high_severity_to_high_priority_agent"] += 1
                
            # Track workload
            if agent.name not in metrics["workload_distribution"]:
                metrics["workload_distribution"][agent.name] = 0
                metrics["agent_severities"][agent.name] = []
            metrics["workload_distribution"][agent.name] += 1
            metrics["agent_severities"][agent.name].append(analysis.severity)
            
            # print occasionally or always for real
            if mode == "real" or i <= 10 or i == num_tickets:
                print(f"Ticket {i:02d} [Sev {analysis.severity}]: Assigned to {agent.name} (Current Load: {agent.current_load}, Skill Match: {match_pct:.0f}%, Cap: {agent.priority_handling_capability})")
        else:
            print(f"Ticket {i:02d} [Sev {analysis.severity}]: UNASSIGNED")

    print("\n" + "="*60)
    print("           ROUTING ALGORITHM EVALUATION METRICS")
    print("="*60)
    print(f"Total Tickets Processed: {metrics['total_processed']}")
    
    if metrics['total_processed'] == 0:
        return

    assignment_rate = (metrics['successfully_assigned'] / metrics['total_processed']) * 100
    print(f"Assignment Rate: {assignment_rate:.1f}%")
    
    if metrics['skill_match_scores']:
        avg_skill_match = sum(metrics['skill_match_scores']) / len(metrics['skill_match_scores'])
        print(f"Average Skill Match: {avg_skill_match:.1f}%")
        
    if metrics['high_severity_total'] > 0:
        critical_handling = (metrics['high_severity_to_high_priority_agent'] / metrics['high_severity_total']) * 100
        print(f"Critical Tickets (Sev >= 4) Handled by High/Med Capable Agents: {critical_handling:.1f}%")
        print(f"Total Critical Tickets: {metrics['high_severity_total']}")
        
    print("\nWorkload Distribution & Average Severity Handled:")
    
    # Sort agents by load descending
    sorted_agents = sorted(metrics['workload_distribution'].items(), key=lambda x: x[1], reverse=True)
    
    for name, load in sorted_agents:
        avg_sev = sum(metrics['agent_severities'][name]) / load if load > 0 else 0
        
        # We need the agent capability to print it
        agent = db.query(models.Employee).filter(models.Employee.name == name).first()
        cap = agent.priority_handling_capability if agent else "Unknown"
        
        print(f"  - {name:<15} | Load: {load:<2} | Avg Sev: {avg_sev:.1f} | Priority Cap: {cap}")
        
    if metrics['workload_distribution']:
        loads = list(metrics['workload_distribution'].values())
        print(f"\nMax load on any single agent: {max(loads)}")
        print(f"Min load on active agents: {min(loads)}")
        print(f"Average load per active agent: {sum(loads)/len(loads):.1f}")
    
    print("="*60)
    db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate IT Ticket Routing Metrics")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--mock", type=int, help="Run evaluation with N mock tickets")
    group.add_argument("--real", type=int, help="Run evaluation with N real tickets from dataset using LLM")
    
    args = parser.parse_args()
    
    random.seed(42) # For reproducibility
    
    if args.mock:
        run_metric_evaluation(args.mock, mode="mock")
    elif args.real:
        run_metric_evaluation(args.real, mode="real")
