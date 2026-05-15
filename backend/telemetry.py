"""
TelemetryEngine — computes 4 AI performance metrics from the SQLite DB.
All calculations are query-time aggregations of persisted Ticket columns.
No external dependencies beyond SQLAlchemy.

Metrics:
  CGR  — Context Grounding Ratio
  RPI  — Routing Precision Index
  HLO  — Human Labor Offset
  SSE  — Semantic Search Efficiency
"""

from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

SSE_MAX_THRESHOLD = 0.8   # must match the value used in submit_ticket


class TelemetryEngine:
    def __init__(self, db: Session):
        self.db = db

    # ─────────────────────────────────────────────────────────────────
    # CGR — Context Grounding Ratio
    #   = avg(context_tokens / total_tokens) across all FAQ tickets
    #   Higher = more grounded in retrieved knowledge, less hallucination
    # ─────────────────────────────────────────────────────────────────
    def compute_cgr(self) -> Optional[float]:
        import models
        faq_tickets = self.db.query(models.Ticket).filter(
            models.Ticket.pipeline_path == "FAQ",
            models.Ticket.cgr_score.isnot(None),
        ).all()
        if not faq_tickets:
            return None
        avg = sum(t.cgr_score for t in faq_tickets) / len(faq_tickets)
        return round(avg, 4)

    # ─────────────────────────────────────────────────────────────────
    # RPI — Routing Precision Index
    #   = (tickets where initial_intent == pipeline_path) / total × 100
    #   Higher = classifier is accurate, fewer fallbacks/reroutes
    # ─────────────────────────────────────────────────────────────────
    def compute_rpi(self) -> Optional[float]:
        import models

        # Map intent labels to pipeline_path values (case-insensitive)
        intent_to_path = {"action": "Action", "faq": "FAQ", "complex": "Complex"}

        routed = self.db.query(models.Ticket).filter(
            models.Ticket.initial_intent.isnot(None),
            models.Ticket.pipeline_path.isnot(None),
        ).all()
        if not routed:
            return None
        correct = sum(
            1 for t in routed
            if intent_to_path.get(t.initial_intent.lower()) == t.pipeline_path
        )
        return round((correct / len(routed)) * 100, 2)

    # ─────────────────────────────────────────────────────────────────
    # HLO — Human Labor Offset
    #   = (Action + FAQ tickets) / total over time window × 100
    #   Higher = more work fully automated, less burden on IT staff
    # ─────────────────────────────────────────────────────────────────
    def compute_hlo(self, days: int = 30) -> Optional[float]:
        import models
        cutoff = datetime.utcnow() - timedelta(days=days)
        total = self.db.query(models.Ticket).filter(
            models.Ticket.created_at >= cutoff
        ).count()
        if total == 0:
            return None
        automated = self.db.query(models.Ticket).filter(
            models.Ticket.created_at >= cutoff,
            models.Ticket.pipeline_path.in_(["Action", "FAQ"]),
        ).count()
        return round((automated / total) * 100, 2)

    # ─────────────────────────────────────────────────────────────────
    # SSE — Semantic Search Efficiency
    #   = avg(sse_score) across FAQ tickets = avg((1 - d/threshold) × conf)
    #   Higher = ChromaDB retrieval is close and confident (max 1.0)
    # ─────────────────────────────────────────────────────────────────
    def compute_sse(self) -> Optional[float]:
        import models
        sse_tickets = self.db.query(models.Ticket).filter(
            models.Ticket.pipeline_path == "FAQ",
            models.Ticket.sse_score.isnot(None),
        ).all()
        if not sse_tickets:
            return None
        avg = sum(t.sse_score for t in sse_tickets) / len(sse_tickets)
        return round(avg, 4)

    # ─────────────────────────────────────────────────────────────────
    # Master aggregator — returns all 4 metrics in structured form
    # ─────────────────────────────────────────────────────────────────
    def compute_all(self, hlo_days: int = 30) -> dict:
        import models

        cgr = self.compute_cgr()
        rpi = self.compute_rpi()
        hlo = self.compute_hlo(days=hlo_days)
        sse = self.compute_sse()

        # Supporting counts for context
        total_tickets = self.db.query(models.Ticket).count()
        cutoff = datetime.utcnow() - timedelta(days=hlo_days)
        rpi_sample  = self.db.query(models.Ticket).filter(models.Ticket.initial_intent.isnot(None)).count()
        sse_sample  = self.db.query(models.Ticket).filter(models.Ticket.sse_score.isnot(None)).count()
        hlo_total   = self.db.query(models.Ticket).filter(models.Ticket.created_at >= cutoff).count()

        def pct_display(v: Optional[float]) -> str:
            return f"{round(v, 1)}%" if v is not None else "N/A"

        def score_display(v: Optional[float]) -> str:
            return f"{round(v, 3)}" if v is not None else "N/A"

        return {
            "cgr": {
                "value": cgr,
                "display": pct_display(cgr * 100 if cgr is not None else None),
                "label": "Context Grounding Ratio",
                "description": "Proportion of RAG answers derived from retrieved context vs. LLM knowledge",
                "interpretation": "higher is better",
                "sample_size": sse_sample,
            },
            "rpi": {
                "value": rpi,
                "display": pct_display(rpi),
                "label": "Routing Precision Index",
                "description": "Percentage of tickets correctly classified on first attempt (no fallback rerouting)",
                "interpretation": "higher is better",
                "sample_size": rpi_sample,
            },
            "hlo": {
                "value": hlo,
                "display": pct_display(hlo),
                "label": "Human Labor Offset",
                "description": f"Tickets fully resolved by automation (Action + FAQ) in the last {hlo_days} days",
                "interpretation": "higher is better",
                "window_days": hlo_days,
                "sample_size": hlo_total,
            },
            "sse": {
                "value": sse,
                "display": score_display(sse),
                "label": "Semantic Search Efficiency",
                "description": "ChromaDB retrieval quality: proximity of retrieved vectors × LLM confidence (max 1.0)",
                "interpretation": "higher is better",
                "sample_size": sse_sample,
            },
            "meta": {
                "total_tickets": total_tickets,
                "computed_at": datetime.utcnow().isoformat() + "Z",
            },
        }
