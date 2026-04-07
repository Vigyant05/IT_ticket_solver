import os
import json
import google.generativeai as genai
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)

# Auto-detect best generative model
def get_best_model():
    try:
        available = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        # Prefer flash for speed, then pro
        for preferred in ['gemini-3-flash-preview', 'gemini-1.5-pro', 'gemini-pro']:
            for model_name in available:
                if preferred in model_name:
                    return model_name
        return available[0] if available else 'gemini-3-flash-preview'
    except:
        return 'gemini-3-flash-preview'

model_name = get_best_model()
print(f"LLM Router: Using model {model_name}")
model = genai.GenerativeModel(model_name)

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
1. category: Choose from [Infrastructure, Application, Security, General Support, Network].
2. subcategory: Be specific (e.g., Server failure, CRM Error, Phishing, Password Reset).
3. severity: 1 (Low) to 5 (Critical).
4. urgency: 1 (Low) to 5 (Immediate).
5. required_skills: A list of technical tags needed to solve this (e.g., ["linux", "database", "python"]).
6. is_common_issue: Boolean. True if it's a frequent, documented issue like a password reset or VPN setup.
7. summary: A 1-sentence summary of the core problem.

Return ONLY the JSON.
"""

def analyze_ticket(text: str) -> Optional[TicketAnalysis]:
    try:
        prompt = PROMPT_TEMPLATE.format(ticket_text=text)
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        data = json.loads(response.text)
        return TicketAnalysis(**data)
    except Exception as e:
        print(f"Error analyzing ticket with Gemini: {e}")
        # Fallback to basic classification if LLM fails
        return None

if __name__ == "__main__":
    test_ticket = "My production server keeps crashing after latest deployment and users cannot log in."
    result = analyze_ticket(test_ticket)
    if result:
        print(result.model_dump_json(indent=2))
