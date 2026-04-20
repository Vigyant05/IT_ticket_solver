import os
import json
from ollama import Client
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

# Configure Ollama Cloud
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")
MODEL_ID = "qwen3.5"

if not OLLAMA_API_KEY:
    print("WARNING: OLLAMA_API_KEY is not set. LLM calls will fail.")

client = Client(
    host="https://ollama.com",
    headers={"Authorization": f"Bearer {OLLAMA_API_KEY}"},
)
print(f"LLM Router: Using Ollama Cloud model {MODEL_ID}")

class TicketAnalysis(BaseModel):
    category: str
    subcategory: str
    severity: int
    urgency: int
    required_skills: List[str]
    is_common_issue: bool
    summary: str

PROMPT_TEMPLATE = """
Analyze the following IT support ticket and return a structured JSON response.

Ticket:
{ticket_text}

Rules:
1. category: You MUST choose EXACTLY ONE from this list: [Infrastructure, Application, Security, General Support, Network]. Do not invent new categories.
2. subcategory: Be specific (e.g., Server failure, CRM Error, Phishing, Password Reset).
3. severity: 1 (Low) to 5 (Critical).
4. urgency: 1 (Low) to 5 (Immediate).
5. required_skills: A list of technical tags needed to resolve the ticket. You MUST EXCLUSIVELY choose tags from the following allowed list:
[windows, office365, password-reset, outlook, hardware, printers, ios, android, mac-os, web-browser, zoom, teams, vpn, wifi, basic-networking, active-directory, user-onboarding, erp, sap, data-entry-errors, crm, salesforce, api-integration, internal-tools, hris, payroll-system, e-commerce, payment-gateway, shopify, bi-tools, tableau, powerbi, linux, shell-scripting, performance-tuning, db-failures, postgresql, mysql, indexing, storage, san, backups, disaster-recovery, virtualization, vmware, hyper-v, load-balancing, nginx, ha-proxy, docker, kubernetes, aws, terraform, azure, ci-cd, jenkins, ansible, gcp, serverless, lambda, functions, monitoring, prometheus, grafana, logging, python, go, infrastructure-as-code, phishing, malware, incident-response, iam, compliance, vault, encryption, vulnerability-scanning, ethical-hacking, siem, splunk, firewalls, soc, threat-hunting, ddos-mitigation]. Do not invent any tags outside of this list.
6. is_common_issue: Boolean. True if it's a frequent, documented issue like a password reset or VPN setup.
7. summary: A 1-sentence summary of the core problem.

Return ONLY the JSON. No markdown fences, no explanation.
"""

def analyze_ticket(text: str) -> Optional[TicketAnalysis]:
    try:
        prompt = PROMPT_TEMPLATE.format(ticket_text=text)
        response = client.chat(
            model=MODEL_ID,
            messages=[
                {"role": "user", "content": prompt},
            ],
            format="json",
        )
        
        raw_text = response.message.content.strip()
        data = json.loads(raw_text)
        return TicketAnalysis(**data)
    except Exception as e:
        print(f"Error analyzing ticket with Ollama: {e}")
        # Fallback to basic classification if LLM fails
        return None

if __name__ == "__main__":
    test_ticket = "My production server keeps crashing after latest deployment and users cannot log in."
    result = analyze_ticket(test_ticket)
    if result:
        print(result.model_dump_json(indent=2))
