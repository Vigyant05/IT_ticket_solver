from database import SessionLocal, engine, Base
from models import Employee, Ticket
import datetime
import json

def seed_data():
    Base.metadata.drop_all(bind=engine)  # Fresh start
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding employees...")
    employees_data = [
        {"id": 1, "name": "Vigyant N", "email": "veryone@msrit.com", "role": "Associate", "team": "L1 Support", "expertise": ["windows", "office365", "password-reset", "outlook", "macos", "software-install"], "skill": 2, "priority": "Low"},
        {"id": 2, "name": "Oliver J", "email": "oliverj@msrit.com", "role": "Associate", "team": "L1 Support", "expertise": ["hardware", "printers", "ios", "android", "peripherals"], "skill": 1, "priority": "Low"},
        {"id": 3, "name": "Vivekanada S", "email": "vivek@msrit.com", "role": "Associate", "team": "L1 Support", "expertise": ["mac-os", "web-browser", "zoom", "teams", "slack"], "skill": 2, "priority": "Medium"},
        {"id": 4, "name": "Rishab T", "email": "rishabt@msrit.com", "role": "Associate", "team": "L1 Support", "expertise": ["vpn", "wifi", "basic-networking", "intranet"], "skill": 3, "priority": "Medium"},
        {"id": 5, "name": "Shreyas NVM", "email": "shreyasnvm@msrit.com", "role": "Associate", "team": "L1 Support", "expertise": ["active-directory", "user-onboarding", "permissions"], "skill": 3, "priority": "High"},
        {"id": 6, "name": "Rahul M", "email": "rahulm@msrit.com", "role": "Specialist", "team": "L2 Application", "expertise": ["erp", "sap", "data-entry-errors", "jira", "confluence"], "skill": 3, "priority": "Medium"},
        {"id": 7, "name": "Shreya S", "email": "shreyas@msrit.com", "role": "Specialist", "team": "L2 Application", "expertise": ["crm", "salesforce", "api-integration"], "skill": 4, "priority": "High"},
        {"id": 8, "name": "Yasho S", "email": "yashos@msrit.com", "role": "Specialist", "team": "L2 Application", "expertise": ["internal-tools", "hris", "payroll-system"], "skill": 3, "priority": "Medium"},
        {"id": 9, "name": "Reyansh K", "email": "reyanshk@msrit.com", "role": "Specialist", "team": "L2 Application", "expertise": ["e-commerce", "payment-gateway", "shopify"], "skill": 4, "priority": "High"},
        {"id": 10, "name": "Pranay K", "email": "pranayk@msrit.com", "role": "Specialist", "team": "L2 Application", "expertise": ["bi-tools", "tableau", "powerbi"], "skill": 4, "priority": "Medium"},
        {"id": 11, "name": "Zain Al", "email": "zainal@msrit.com", "role": "Architect", "team": "L3 Infrastructure", "expertise": ["linux", "shell-scripting", "performance-tuning", "networking", "dns"], "skill": 5, "priority": "High"},
        {"id": 12, "name": "Jhon S", "email": "jhons@msrit.com", "role": "Senior Engineer", "team": "L3 Infrastructure", "expertise": ["db-failures", "postgresql", "postgres", "mysql", "mongodb", "oracle", "nosql", "indexing"], "skill": 5, "priority": "High"},
        {"id": 13, "name": "Jhonson ", "email": "jhonson@msrit.com", "role": "Senior Engineer", "team": "L3 Infrastructure", "expertise": ["storage", "san", "backups", "disaster-recovery", "data-loss"], "skill": 4, "priority": "High"},
        {"id": 14, "name": "Shreya D", "email": "shreyad@msrit.com", "role": "Architect", "team": "L3 Infrastructure", "expertise": ["virtualization", "vmware", "hyper-v"], "skill": 5, "priority": "High"},
        {"id": 15, "name": "Joyal J", "email": "joyalj@msrit.com", "role": "Senior Engineer", "team": "L3 Infrastructure", "expertise": ["load-balancing", "nginx", "ha-proxy"], "skill": 4, "priority": "Medium"},
        {"id": 16, "name": "Yash R", "email": "yashr@msrit.com", "role": "DevOps Engineer", "team": "DevOps", "expertise": ["docker", "kubernetes", "aws", "terraform"], "skill": 5, "priority": "High"},
        {"id": 17, "name": "Niranjan", "email": "ninanjan@msrit.com", "role": "Cloud Architect", "team": "DevOps", "expertise": ["azure", "ci-cd", "jenkins", "ansible"], "skill": 4, "priority": "High"},
        {"id": 18, "name": "Tejas H", "email": "tejash@msrit.com", "role": "DevOps Engineer", "team": "DevOps", "expertise": ["gcp", "serverless", "lambda", "functions"], "skill": 4, "priority": "Medium"},
        {"id": 19, "name": "Siddhant", "email": "sidhant@msrit.com", "role": "SRE", "team": "DevOps", "expertise": ["monitoring", "prometheus", "grafana", "logging"], "skill": 5, "priority": "High"},
        {"id": 20, "name": "Joji", "email": "joji@msrit.com", "role": "Cloud Engineer", "team": "DevOps", "expertise": ["python", "go", "infrastructure-as-code"], "skill": 3, "priority": "Medium"},
        {"id": 21, "name": "Sai S", "email": "sais@msrit.com", "role": "Security Analyst", "team": "Security", "expertise": ["phishing", "malware", "incident-response"], "skill": 5, "priority": "High"},
        {"id": 22, "name": "Navya A", "email": "navyaa@msrit.com", "role": "Security Specialist", "team": "Security", "expertise": ["iam", "compliance", "vault", "encryption"], "skill": 3, "priority": "Medium"},
        {"id": 23, "name": "Naveen", "email": "naveen@msrit.com", "role": "Penetration Tester", "team": "Security", "expertise": ["vulnerability-scanning", "ethical-hacking"], "skill": 5, "priority": "High"},
        {"id": 24, "name": "Priya", "email": "priya@msrit.com", "role": "Security Engineer", "team": "Security", "expertise": ["siem", "splunk", "firewalls"], "skill": 4, "priority": "High"},
        {"id": 25, "name": "Monisha", "email": "monisha@msrit.com", "role": "Security Analyst", "team": "Security", "expertise": ["soc", "threat-hunting", "ddos-mitigation"], "skill": 4, "priority": "High"},
    ]

    for data in employees_data:
        emp = Employee(
            id=data["id"],
            name=data["name"],
            email=data["email"],
            password="12345",
            role=data["role"],
            team=data["team"],
            expertise_tags=data["expertise"],
            skill_level=data["skill"],
            priority_handling_capability=data["priority"],
            current_load=0,
            availability_status=True
        )
        db.add(emp)
    
    db.commit()
    print(f"Successfully seeded {len(employees_data)} employees.")

    db.close()
    return

    print("Seeding tickets...")
    tickets_data = [
        {"id": 1, "title": "Production ERP System Down", "description": "Our main ERP database (PostgreSQL) is refusing connections. App logs are showing 'Connection Limit Exceeded' errors. This has halted all warehouse operations.", "category": None, "subcategory": None, "severity": None, "urgency": None, "priority_score": None, "status": "open", "assigned_employee_id": None},
        {"id": 5, "title": "VPN Connection Resetting", "description": "My GlobalProtect VPN disconnects every 10 minutes when working from home. I've tried restarting my router but the issue persists.", "category": "General Support", "subcategory": "Manual Triage Required", "severity": 3, "urgency": 3, "priority_score": 3.0, "status": "assigned", "assigned_employee_id": 5},
        {"id": 6, "title": "Suspicious Phishing Email Reported", "description": "Several employees received an email asking for Office 365 credentials from '\n\nit-support@conmpany.com\n'. One user potentially clicked the link.", "category": "General Support", "subcategory": "Manual Triage Required", "severity": 3, "urgency": 3, "priority_score": 3.0, "status": "assigned", "assigned_employee_id": 3},
        {"id": 8, "title": "Unable to login to email", "description": "Hi Team, I forgot my Outlook password and I am unable to login since this morning. Please help me reset it.", "category": "General Support", "subcategory": "Manual Triage Required", "severity": 3, "urgency": 3, "priority_score": 3.0, "status": "assigned", "assigned_employee_id": 5},
        {"id": 9, "title": "Need MS Project installed", "description": "I need Microsoft Project for planning tasks. It is not available in my system. Please install it.", "category": "General Support", "subcategory": "Manual Triage Required", "severity": 3, "urgency": 3, "priority_score": 3.0, "status": "assigned", "assigned_employee_id": 1},
        {"id": 11, "title": "ERP system very slow today", "description": "The finance ERP module is taking more than 2 minutes to load reports. This is affecting our workflow.", "category": "General Support", "subcategory": "Manual Triage Required", "severity": 3, "urgency": 3, "priority_score": 3.0, "status": "assigned", "assigned_employee_id": 5},
        {"id": 14, "title": "VPN disconnecting frequently ", "description": "My VPN keeps disconnecting every 10 minutes. I am working remotely and cannot access internal servers reliably.", "category": "General Support", "subcategory": "Manual Triage Required", "severity": 3, "urgency": 3, "priority_score": 3.0, "status": "assigned", "assigned_employee_id": 3},
        {"id": 20, "title": "Pods restarting continuously in production", "description": "Multiple Kubernetes pods are in CrashLoopBackOff state after latest config update", "category": "General Support", "subcategory": "Manual Triage Required", "severity": 3, "urgency": 3, "priority_score": 3.0, "status": "assigned", "assigned_employee_id": 5},
        {"id": 21, "title": "URGENT HELP NEEDED", "description": "Nothing is working. I cannot access anything and my manager is asking for updates. Please fix this ASAP.", "category": "General Support", "subcategory": "System Access Issue", "severity": 4, "urgency": 5, "priority_score": 4.4, "status": "assigned", "assigned_employee_id": 5},
        {"id": 22, "title": "Need MS Project installed", "description": "I need Microsoft Project for planning tasks. It is not available in my system. Please install it.", "category": "Application", "subcategory": "Software Installation", "severity": 1, "urgency": 2, "priority_score": 1.4, "status": "assigned", "assigned_employee_id": 7},
        {"id": 23, "title": "Primary Database server is down", "description": "The primary PostgreSQL database server is not responding. All dependent applications are down.", "category": "Infrastructure", "subcategory": "Server failure", "severity": 5, "urgency": 5, "priority_score": 5.0, "status": "assigned", "assigned_employee_id": 11},
        {"id": 24, "title": "Not able to connect to server", "description": "Unable to connect to servers", "category": "Infrastructure", "subcategory": "Server Connectivity", "severity": 4, "urgency": 4, "priority_score": 4.0, "status": "assigned", "assigned_employee_id": 12},
    ]

    for data in tickets_data:
        ticket = Ticket(
            id=data["id"],
            title=data["title"],
            description=data["description"],
            category=data["category"],
            subcategory=data["subcategory"],
            severity=data["severity"],
            urgency=data["urgency"],
            priority_score=data["priority_score"],
            status=data["status"],
            assigned_employee_id=data["assigned_employee_id"],
            created_at=datetime.datetime.utcnow()
        )
        db.add(ticket)
        
        # Update employee load if assigned
        if data["assigned_employee_id"]:
            emp = db.query(Employee).filter(Employee.id == data["assigned_employee_id"]).first()
            if emp:
                emp.current_load += 1

    db.commit()
    print(f"Successfully seeded {len(tickets_data)} tickets.")
    db.close()

if __name__ == "__main__":
    seed_data()
