from database import SessionLocal, engine, Base
from models import Employee, Ticket
import json

def seed_employees():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if we already have employees
    if db.query(Employee).count() > 0:
        print("Employee data already seeded.")
        db.close()
        return

    employees_data = [
        # Team 1: L1 Support (General)
        {"name": "Alice Johnson", "email": "alice@company.com", "role": "Associate", "team": "L1 Support", "expertise": ["windows", "office365", "password-reset", "outlook"], "skill": 2, "priority": "Low"},
        {"name": "Bob Smith", "email": "bob@company.com", "role": "Associate", "team": "L1 Support", "expertise": ["hardware", "printers", "ios", "android"], "skill": 1, "priority": "Low"},
        {"name": "Charlie Davis", "email": "charlie@company.com", "role": "Associate", "team": "L1 Support", "expertise": ["mac-os", "web-browser", "zoom", "teams"], "skill": 2, "priority": "Medium"},
        {"name": "Diana Prince", "email": "diana@company.com", "role": "Associate", "team": "L1 Support", "expertise": ["vpn", "wifi", "basic-networking"], "skill": 3, "priority": "Medium"},
        {"name": "Evan Wright", "email": "evan@company.com", "role": "Associate", "team": "L1 Support", "expertise": ["active-directory", "user-onboarding"], "skill": 3, "priority": "High"},

        # Team 2: L2 Application Support
        {"name": "Fiona Glenanne", "email": "fiona@company.com", "role": "Specialist", "team": "L2 Application", "expertise": ["erp", "sap", "data-entry-errors"], "skill": 3, "priority": "Medium"},
        {"name": "George Bluth", "email": "george@company.com", "role": "Specialist", "team": "L2 Application", "expertise": ["crm", "salesforce", "api-integration"], "skill": 4, "priority": "High"},
        {"name": "Hannah Abbott", "email": "hannah@company.com", "role": "Specialist", "team": "L2 Application", "expertise": ["internal-tools", "hris", "payroll-system"], "skill": 3, "priority": "Medium"},
        {"name": "Ian Malcolm", "email": "ian@company.com", "role": "Specialist", "team": "L2 Application", "expertise": ["e-commerce", "payment-gateway", "shopify"], "skill": 4, "priority": "High"},
        {"name": "Jasmine Tookes", "email": "jasmine@company.com", "role": "Specialist", "team": "L2 Application", "expertise": ["bi-tools", "tableau", "powerbi"], "skill": 4, "priority": "Medium"},

        # Team 3: L3 Infrastructure
        {"name": "Kevin Flynn", "email": "kevin@company.com", "role": "Architect", "team": "L3 Infrastructure", "expertise": ["linux", "shell-scripting", "performance-tuning"], "skill": 5, "priority": "High"},
        {"name": "Lara Croft", "email": "lara@company.com", "role": "Senior Engineer", "team": "L3 Infrastructure", "expertise": ["db-failures", "postgresql", "mysql", "indexing"], "skill": 5, "priority": "High"},
        {"name": "Michael Scott", "email": "michael@company.com", "role": "Senior Engineer", "team": "L3 Infrastructure", "expertise": ["storage", "san", "backups", "disaster-recovery"], "skill": 4, "priority": "High"},
        {"name": "Nina Sharp", "email": "nina@company.com", "role": "Architect", "team": "L3 Infrastructure", "expertise": ["virtualization", "vmware", "hyper-v"], "skill": 5, "priority": "High"},
        {"name": "Oscar Martinez", "email": "oscar@company.com", "role": "Senior Engineer", "team": "L3 Infrastructure", "expertise": ["load-balancing", "nginx", "ha-proxy"], "skill": 4, "priority": "Medium"},

        # Team 4: DevOps & Cloud
        {"name": "Rahul Sharma", "email": "rahul@company.com", "role": "DevOps Engineer", "team": "DevOps", "expertise": ["docker", "kubernetes", "aws", "terraform"], "skill": 5, "priority": "High"},
        {"name": "Elena Petrova", "email": "elena@company.com", "role": "Cloud Architect", "team": "DevOps", "expertise": ["azure", "ci-cd", "jenkins", "ansible"], "skill": 4, "priority": "High"},
        {"name": "Sam Fisher", "email": "sam@company.com", "role": "DevOps Engineer", "team": "DevOps", "expertise": ["gcp", "serverless", "lambda", "functions"], "skill": 4, "priority": "Medium"},
        {"name": "Tara Knowles", "email": "tara@company.com", "role": "SRE", "team": "DevOps", "expertise": ["monitoring", "prometheus", "grafana", "logging"], "skill": 5, "priority": "High"},
        {"name": "Uriel Ventris", "email": "uriel@company.com", "role": "Cloud Engineer", "team": "DevOps", "expertise": ["python", "go", "infrastructure-as-code"], "skill": 3, "priority": "Medium"},

        # Team 5: Security Team
        {"name": "Marcus Vane", "email": "marcus@company.com", "role": "Security Analyst", "team": "Security", "expertise": ["phishing", "malware", "incident-response"], "skill": 5, "priority": "High"},
        {"name": "Sarah Lee", "email": "sarah@company.com", "role": "Security Specialist", "team": "Security", "expertise": ["iam", "compliance", "vault", "encryption"], "skill": 3, "priority": "Medium"},
        {"name": "Victor Creed", "email": "victor@company.com", "role": "Penetration Tester", "team": "Security", "expertise": ["vulnerability-scanning", "ethical-hacking"], "skill": 5, "priority": "High"},
        {"name": "Wanda Maximoff", "email": "wanda@company.com", "role": "Security Engineer", "team": "Security", "expertise": ["siem", "splunk", "firewalls"], "skill": 4, "priority": "High"},
        {"name": "Xavier Renegade", "email": "xavier@company.com", "role": "Security Analyst", "team": "Security", "expertise": ["soc", "threat-hunting", "ddos-mitigation"], "skill": 4, "priority": "High"},
    ]

    for data in employees_data:
        emp = Employee(
            name=data["name"],
            email=data["email"],
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

if __name__ == "__main__":
    seed_employees()
