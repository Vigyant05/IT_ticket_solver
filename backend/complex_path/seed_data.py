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
        {"id": 26, "name": "Aditi", "email": "aditi@msrit.com", "role": "User", "team": "None", "expertise": [], "skill": 0, "priority": "Low"},
        {"id": 27, "name": "Kavya", "email": "kavya@msrit.com", "role": "User", "team": "None", "expertise": [], "skill": 0, "priority": "Low"},
        {"id": 28, "name": "Abhishek", "email": "abhishek@msrit.com", "role": "User", "team": "None", "expertise": [], "skill": 0, "priority": "Low"},
        {"id": 29, "name": "Admin_System", "email": "admin@msrit.com", "role": "Admin", "team": "Admin", "expertise": [], "skill": 0, "priority": "Low"},
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

    db.commit()
    print(f"Successfully seeded {len(employees_data)} employees.")

    print("Seeding 25 random tickets...")
    import random
    
    users = db.query(Employee).filter(Employee.role == "User").all()
    staff = db.query(Employee).filter(Employee.role != "User", Employee.role != "Admin").all()
    
    ticket_pool = [
        {"title": "Docker container failing on AWS", "desc": "My production container is crashing with OOM errors in the US-East-1 region. Need help checking Terraform configs.", "keywords": ["docker", "kubernetes", "aws", "terraform"]},
        {"title": "VPN access denied", "desc": "Cannot connect to the corporate VPN from my home network. WiFi is working fine.", "keywords": ["vpn", "wifi", "networking"]},
        {"title": "Outlook password reset", "desc": "Locked out of my Office 365 account. Need a password reset for my email.", "keywords": ["password-reset", "office365", "outlook"]},
        {"title": "MacBook Pro keyboard issue", "desc": "Several keys on my laptop are not responding. Might be a hardware problem.", "keywords": ["macos", "hardware", "mac-os"]},
        {"title": "Slow database queries", "desc": "Our PostgreSQL database is extremely slow during peak hours. Need help with indexing.", "keywords": ["postgresql", "postgres", "mysql", "db-failures"]},
        {"title": "Suspicious email received", "desc": "I received an email asking for my credentials. Looks like phishing.", "keywords": ["phishing", "malware", "security"]},
        {"title": "Kubernetes Pod crashing", "desc": "The pods in our production cluster are in CrashLoopBackOff state.", "keywords": ["kubernetes", "docker", "gcp"]},
        {"title": "Printer not working", "desc": "The L3 printer in the main hallway is showing an error code and won't print.", "keywords": ["printers", "hardware"]},
        {"title": "Nginx configuration error", "desc": "Getting 502 Bad Gateway on the main load balancer.", "keywords": ["nginx", "load-balancing", "ha-proxy"]},
        {"title": "Data loss on SAN", "desc": "We are unable to access some files on the shared storage server.", "keywords": ["storage", "san", "backups", "data-loss"]},
        {"title": "SAP portal error", "desc": "Error 404 when trying to access the SAP ERP portal.", "keywords": ["sap", "erp", "data-entry-errors"]},
        {"title": "Salesforce sync failed", "desc": "The CRM is not syncing with our internal API.", "keywords": ["crm", "salesforce", "api-integration"]},
        {"title": "Linux server performance", "desc": "The shell scripts are running very slow on the production Linux box.", "keywords": ["linux", "shell-scripting", "performance-tuning"]},
        {"title": "Zoom meeting issues", "desc": "Microphone not working during Zoom calls on my Mac.", "keywords": ["zoom", "teams", "slack", "mac-os"]},
        {"title": "New employee onboarding", "desc": "Need to setup permissions and active directory access for a new hire.", "keywords": ["active-directory", "user-onboarding", "permissions"]},
        {"title": "Vulnerability found in app", "desc": "Recent scan showed a SQL injection vulnerability in our staging site.", "keywords": ["vulnerability-scanning", "ethical-hacking", "incident-response"]},
        {"title": "Tableau dashboard not loading", "desc": "The PowerBI report is showing no data after the latest refresh.", "keywords": ["bi-tools", "tableau", "powerbi"]},
        {"title": "Nginx HA Proxy issue", "desc": "Load balancer is not distributing traffic evenly.", "keywords": ["load-balancing", "ha-proxy", "nginx"]},
        {"title": "Windows Update stuck", "desc": "My Windows 10 machine is stuck at 45% during update for 3 hours.", "keywords": ["windows", "software-install"]},
        {"title": "Android phone sync", "desc": "My work emails are not syncing to my Android device.", "keywords": ["android", "ios", "peripherals"]},
    ]

    for i in range(1, 26):
        template = random.choice(ticket_pool)
        user = random.choice(users)
        
        # Find best employee match
        assigned_emp = None
        for emp in staff:
            if any(k in (emp.expertise_tags or []) for k in template["keywords"]):
                assigned_emp = emp
                break
        
        # Fallback to random staff if no match
        if not assigned_emp:
            assigned_emp = random.choice(staff)
            
        ticket = Ticket(
            id=i,
            title=template["title"],
            description=template["desc"],
            requester_name=user.name,
            requester_id=user.id,
            category="Complex",
            subcategory="Assigned from Seed",
            severity=random.randint(1, 5),
            urgency=random.randint(1, 5),
            priority_score=random.uniform(1.0, 5.0),
            status="assigned",
            assigned_employee_id=assigned_emp.id,
            pipeline_path="Complex",
            created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=random.randint(1, 100))
        )
        db.add(ticket)
        assigned_emp.current_load += 1

    db.commit()
    print(f"Successfully seeded 25 random tickets.")
    db.close()

if __name__ == "__main__":
    seed_data()
