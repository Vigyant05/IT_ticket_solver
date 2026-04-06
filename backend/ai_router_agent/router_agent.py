"""
AI Router Agent — Central Dispatcher for IT Support Automation
===============================================================
Classifies incoming IT support tickets into one of three intents
(FAQ, Action, Complex) using Vertex AI's Gemini model and routes
them to the appropriate downstream handler.

Usage:
    python router_agent.py                            # Run built-in test tickets
    python router_agent.py --csv test_tickets.csv     # Classify from a CSV file
    python router_agent.py "Reset my password"        # Classify a single ticket
"""

from __future__ import annotations

import csv
import json
import logging
import os
import sys
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv

import vertexai
from vertexai.generative_models import (
    GenerationConfig,
    GenerativeModel,
    HarmBlockThreshold,
    HarmCategory,
    Part,
)

# ---------------------------------------------------------------------------
# Configuration — loaded from .env in the same directory
# ---------------------------------------------------------------------------

_ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(_ENV_PATH)

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
MODEL_ID = "gemini-2.5-flash"

if not PROJECT_ID:
    raise RuntimeError(
        f"GOOGLE_CLOUD_PROJECT is not set. "
        f"Please define it in {_ENV_PATH} or as an environment variable."
    )

SYSTEM_PROMPT = """\
You are an enterprise IT support ticket intent classifier.

Read the ticket text provided by the user and classify it into EXACTLY ONE of these three categories:

• FAQ     — The user is asking *how* to do something, requesting a manual, or looking for information. (e.g., "How do I connect to VPN?", "Where is the policy?")
• Action  — The user is asking the system to *execute* a routine, automated task for them. (e.g., "Reset my password", "Unlock my account", "Grant me access").
• Complex — The user is reporting a severe, nuanced, hardware-level, or unautomated issue that requires a human expert. (e.g., "Server down", "Database crashing", "Laptop won't boot").

CRITICAL RULES:
1. The "How vs. Do" Rule: If the user asks for instructions (e.g., "How do I reset my password?"), classify as FAQ. If they request the action be done for them (e.g., "Please reset my password"), classify as Action.
2. The Vagueness Rule: If a ticket is too short or vague to understand (e.g., "Help", "It's broken", "Error"), classify it as Complex so a human can investigate.

Respond ONLY with valid JSON in this exact format: {"intent": "FAQ"} or {"intent": "Action"} or {"intent": "Complex"}.
No markdown, no explanation, no extra text.
"""

VALID_INTENTS = {"FAQ", "Action", "Complex"}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Downstream Route Handlers (placeholders)
# ---------------------------------------------------------------------------


def route_to_faq_rag(ticket: str) -> None:
    """Route ticket to the RAG-powered knowledge-base pipeline."""
    logger.info("📚  [FAQ]  Routing to RAG Knowledge Base...")
    logger.info("       Ticket: %s", ticket)
    # TODO: Call the FAQ / RAG retrieval service


def route_to_tool_execution(ticket: str) -> None:
    """Route ticket to the automated tool-execution pipeline."""
    logger.info("⚙️   [Action]  Routing to Tool Execution Engine...")
    logger.info("       Ticket: %s", ticket)
    # TODO: Call the action / tool-execution service


def route_to_human_expert(ticket: str) -> None:
    """Route ticket to a human expert for manual investigation."""
    logger.info("🧑‍💻  [Complex]  Routing to Human Expert Queue...")
    logger.info("       Ticket: %s", ticket)
    # TODO: Create a ticket in the escalation queue


# ---------------------------------------------------------------------------
# Core Router
# ---------------------------------------------------------------------------

IntentLabel = Literal["FAQ", "Action", "Complex"]

# Enforce strict JSON output via a response schema
_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "intent": {
            "type": "string",
            "enum": ["FAQ", "Action", "Complex"],
        }
    },
    "required": ["intent"],
}


def _build_model() -> GenerativeModel:
    """Initialise Vertex AI and return the configured Gemini model."""
    vertexai.init(project=PROJECT_ID, location=LOCATION)

    model = GenerativeModel(
        model_name=MODEL_ID,
        system_instruction=[Part.from_text(SYSTEM_PROMPT)],
        generation_config=GenerationConfig(
            temperature=0.0,
            max_output_tokens=1024,
            response_mime_type="application/json",
            response_schema=_RESPONSE_SCHEMA,
        ),
        safety_settings={
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        },
    )
    return model


def classify_ticket(model: GenerativeModel, ticket: str) -> IntentLabel:
    """
    Send a ticket to the Gemini model and return the classified intent.

    Falls back to ``"Complex"`` if the API call fails or the response
    cannot be parsed — ensuring that ambiguous tickets always reach a
    human expert.
    """
    try:
        response = model.generate_content(ticket)
        raw_text = response.text.strip()
        logger.debug("Raw model response: %s", raw_text)

        payload: dict = json.loads(raw_text)
        intent: str = payload.get("intent", "")

        if intent not in VALID_INTENTS:
            logger.warning(
                "Model returned unknown intent '%s'. Defaulting to Complex.",
                intent,
            )
            return "Complex"

        return intent  # type: ignore[return-value]

    except json.JSONDecodeError as exc:
        logger.error("Failed to parse model response as JSON: %s", exc)
        return "Complex"

    except Exception as exc:  # noqa: BLE001
        logger.error("Vertex AI API call failed: %s", exc)
        return "Complex"


def route_ticket(model: GenerativeModel, ticket: str) -> IntentLabel:
    """Classify a ticket and dispatch it to the appropriate handler."""
    intent = classify_ticket(model, ticket)

    if intent == "FAQ":
        route_to_faq_rag(ticket)
    elif intent == "Action":
        route_to_tool_execution(ticket)
    else:
        route_to_human_expert(ticket)

    return intent


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

_TEST_TICKETS: list[tuple[str, str]] = [
    # (ticket_text, expected_intent)
    ("How do I connect to the company VPN from my Mac?", "FAQ"),
    ("Where can I find the employee handbook?", "FAQ"),
    ("How do I reset my password?", "FAQ"),
    ("Please reset my Active Directory password.", "Action"),
    ("Unlock my account — it's been locked after too many attempts.", "Action"),
    ("Grant me read access to the shared marketing drive.", "Action"),
    ("The production database server has been crashing every 10 minutes since 3 AM.", "Complex"),
    ("My laptop screen is flickering and there's a burning smell.", "Complex"),
    ("Help", "Complex"),
    ("Error", "Complex"),
]


def _run_test_suite(
    model: GenerativeModel,
    tickets: list[tuple[str, str, str | None]],
    label: str = "Test Mode",
) -> None:
    """Run classification on a list of (id, text, expected_intent) tuples."""
    print("\n" + "=" * 70)
    print(f"  AI Router Agent — IT Support Ticket Classifier ({label})")
    print("=" * 70)

    results: list[dict[str, str]] = []

    for ticket_id, ticket_text, expected in tickets:
        print(f"\n{'─' * 70}")
        id_label = f"  🆔  ID      : {ticket_id}\n" if ticket_id else ""
        print(f"{id_label}  📩  Ticket  : {ticket_text}")
        if expected:
            print(f"  🎯  Expected: {expected}")

        intent = route_ticket(model, ticket_text)

        if expected:
            match = "✅" if intent == expected else "❌"
            print(f"  📌  Got     : {intent}  {match}")
        else:
            print(f"  📌  Got     : {intent}")

        results.append(
            {"id": ticket_id, "ticket": ticket_text, "expected": expected or "", "got": intent}
        )

    # Summary
    if any(r["expected"] for r in results):
        correct = sum(1 for r in results if r["expected"] == r["got"])
        total = len(results)
        print(f"\n{'=' * 70}")
        print(f"  Results: {correct}/{total} matched expected intent")
    else:
        print(f"\n{'=' * 70}")
        print(f"  Classified {len(results)} tickets")
    print("=" * 70 + "\n")


def _load_csv(path: str) -> list[tuple[str, str, str | None]]:
    """Load tickets from a CSV file.

    Expected columns: ticket_id, ticket_text, expected_intent (optional).
    """
    tickets: list[tuple[str, str, str | None]] = []
    csv_path = Path(path)
    if not csv_path.is_absolute():
        csv_path = Path(__file__).resolve().parent / csv_path

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            ticket_id = row.get("ticket_id", "").strip()
            ticket_text = row.get("ticket_text", "").strip()
            expected = row.get("expected_intent", "").strip() or None
            if ticket_text:
                tickets.append((ticket_id, ticket_text, expected))

    logger.info("Loaded %d tickets from %s", len(tickets), csv_path)
    return tickets


def main() -> None:
    """Run the router against test tickets, a CSV file, or a single CLI argument."""
    model = _build_model()

    # --csv <file>  →  batch mode from CSV
    if "--csv" in sys.argv:
        idx = sys.argv.index("--csv")
        if idx + 1 >= len(sys.argv):
            print("Usage: python router_agent.py --csv <path_to_csv>")
            sys.exit(1)
        csv_file = sys.argv[idx + 1]
        tickets = _load_csv(csv_file)
        _run_test_suite(model, tickets, label=f"CSV: {csv_file}")
        return

    # Single ticket via CLI args
    if len(sys.argv) > 1:
        ticket_text = " ".join(sys.argv[1:])
        print(f"\n{'=' * 60}")
        print(f"  Ticket : {ticket_text}")
        print(f"{'=' * 60}")
        intent = route_ticket(model, ticket_text)
        print(f"  Result : {intent}")
        print(f"{'=' * 60}\n")
        return

    # Default: built-in test suite
    builtin = [(f"BUILT-{i+1}", t, e) for i, (t, e) in enumerate(_TEST_TICKETS)]
    _run_test_suite(model, builtin, label="Built-in Test Suite")


if __name__ == "__main__":
    main()
