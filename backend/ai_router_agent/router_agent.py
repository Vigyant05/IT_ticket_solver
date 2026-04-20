"""
AI Router Agent — Central Dispatcher for IT Support Automation
===============================================================
Classifies incoming IT support tickets into one of three intents
(FAQ, Action, Complex) using Ollama Cloud's Qwen3.5 model and routes
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
from ollama import Client

# ---------------------------------------------------------------------------
# Configuration — loaded from .env in the same directory
# ---------------------------------------------------------------------------

_ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(_ENV_PATH)

OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")
MODEL_ID = "qwen3.5"

if not OLLAMA_API_KEY:
    raise RuntimeError(
        f"OLLAMA_API_KEY is not set. "
        f"Please define it in {_ENV_PATH} or as an environment variable."
    )

SYSTEM_PROMPT = """\
You are an enterprise IT support ticket intent classifier. Your job is to read a ticket and output EXACTLY ONE of three labels: FAQ, Action, or Complex.

━━━ STEP 1: SCAN FOR ACTION VERBS FIRST ━━━
Before doing anything else, search the ticket text for these power words — even if they are buried inside a long, messy email chain:
  ACTION VERBS: please add, please create, please assign, please update, please send,
                please log, please make arrangements, please allocate, please grant,
                please reset, please unlock, please revoke, please change, please set up,
                get quote for, order, purchase request, kindly assist resetting

If you find ANY of these — even once in a long noisy email — classify as → Action.

━━━ STEP 2: CHECK IF IT IS A KNOWLEDGE/DOCUMENTATION REQUEST ━━━
If no action verbs were found, check if the user is asking for:
  - Instructions, how-to steps, guides, or documentation
  - Integration guidelines, setup documentation, troubleshooting tips
  - Information about a known error (e.g., "have following error when I try to fill...")
  - Status update on a known ongoing issue

If yes → classify as FAQ. These are INFORMATION requests, NOT Complex, regardless of technical jargon.

━━━ STEP 3: ONLY THEN CONSIDER COMPLEX ━━━
Use Complex ONLY IF the ticket describes:
  - An active, severe, unresolved system-wide or hardware failure (server down, network outage, database crash)
  - A security breach or unauthorized access requiring immediate incident response
  - A request that requires deep expert knowledge that CANNOT be resolved by a standard action or a known document
  - A ticket so vague it cannot be understood (e.g., just "Help", "Error", "Not working")

━━━ EXAMPLES ━━━
• "please add phone number... please create shared mailbox... please assign phone number" → Action (action verbs found)
• "please make necessary arrangements have battery pack sent, get quote for replacement battery" → Action (action verbs found)
• "seeking comprehensive integration guidelines for Cassandra with Redis... supply documentation" → FAQ (asking for docs/guides)
• "A healthcare organization encountered unauthorized access to medical records, firewall breach" → Complex (active severe incident)
• "website experiencing downtime... restarted server, cleared cache, issue still persists" → Complex (active unresolved failure)

━━━ OUTPUT FORMAT ━━━
Respond ONLY with valid JSON. No markdown, no explanation, no extra text.
{"intent": "FAQ"} or {"intent": "Action"} or {"intent": "Complex"}
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
    logger.info("  [FAQ]  Routing to RAG Knowledge Base...")
    logger.info("       Ticket: %s", ticket)
    # TODO: Call the FAQ / RAG retrieval service


def route_to_tool_execution(ticket: str) -> None:
    """Route ticket to the automated tool-execution pipeline."""
    logger.info("  [Action]  Routing to Tool Execution Engine...")
    logger.info("       Ticket: %s", ticket)
    # TODO: Call the action / tool-execution service


def route_to_human_expert(ticket: str) -> None:
    """Route ticket to a human expert for manual investigation."""
    logger.info("  [Complex]  Routing to Human Expert Queue...")
    logger.info("       Ticket: %s", ticket)
    # TODO: Create a ticket in the escalation queue


# ---------------------------------------------------------------------------
# Core Router
# ---------------------------------------------------------------------------

IntentLabel = Literal["FAQ", "Action", "Complex"]


def _build_client() -> Client:
    """Initialise the Ollama Cloud client."""
    client = Client(
        host="https://ollama.com",
        headers={"Authorization": f"Bearer {OLLAMA_API_KEY}"},
    )
    logger.info("Ollama Cloud client initialized with model: %s", MODEL_ID)
    return client


def classify_ticket(client: Client, ticket: str) -> IntentLabel:
    """
    Send a ticket to the Ollama Cloud model and return the classified intent.

    Falls back to ``"Complex"`` if the API call fails or the response
    cannot be parsed — ensuring that ambiguous tickets always reach a
    human expert.
    """
    try:
        response = client.chat(
            model=MODEL_ID,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": ticket},
            ],
            format="json",
        )
        raw_text = response.message.content.strip()
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
        logger.error("Ollama Cloud API call failed: %s", exc)
        return "Complex"


def route_ticket(client: Client, ticket: str) -> IntentLabel:
    """Classify a ticket and dispatch it to the appropriate handler."""
    intent = classify_ticket(client, ticket)

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
    client: Client,
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
        id_label = f"  ID      : {ticket_id}\n" if ticket_id else ""
        print(f"{id_label}  Ticket  : {ticket_text}")
        if expected:
            print(f"  Expected: {expected}")

        intent = route_ticket(client, ticket_text)

        if expected:
            match = "PASS" if intent == expected else "FAIL"
            print(f"  Got     : {intent}  {match}")
        else:
            print(f"  Got     : {intent}")

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
    client = _build_client()

    # --csv <file>  →  batch mode from CSV
    if "--csv" in sys.argv:
        idx = sys.argv.index("--csv")
        if idx + 1 >= len(sys.argv):
            print("Usage: python router_agent.py --csv <path_to_csv>")
            sys.exit(1)
        csv_file = sys.argv[idx + 1]
        tickets = _load_csv(csv_file)
        _run_test_suite(client, tickets, label=f"CSV: {csv_file}")
        return

    # Single ticket via CLI args
    if len(sys.argv) > 1:
        ticket_text = " ".join(sys.argv[1:])
        print(f"\n{'=' * 60}")
        print(f"  Ticket : {ticket_text}")
        print(f"{'=' * 60}")
        intent = route_ticket(client, ticket_text)
        print(f"  Result : {intent}")
        print(f"{'=' * 60}\n")
        return

    # Default: built-in test suite
    builtin = [(f"BUILT-{i+1}", t, e) for i, (t, e) in enumerate(_TEST_TICKETS)]
    _run_test_suite(client, builtin, label="Built-in Test Suite")


if __name__ == "__main__":
    main()
