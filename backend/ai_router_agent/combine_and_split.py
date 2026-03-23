"""
Combine both classified ticket datasets, keep only text + intent,
remove Error rows, and split into 3 files by intent.

Usage:
    python combine_and_split.py

Output (in ../../dataset/):
    ├── combined_tickets.csv
    ├── FAQ/tickets_faq.csv
    ├── Action/tickets_action.csv
    └── Complex/tickets_complex.csv
"""

import os
import pandas as pd

# ── Paths ────────────────────────────────────────────────────────────
FILTERED_CSV = "classified_tickets.csv"
KAGGLE_CSV = "classified_kaggle.csv"

DATASET_DIR = "../../dataset"
COMBINED_CSV = f"{DATASET_DIR}/combined_tickets.csv"
FAQ_DIR = f"{DATASET_DIR}/FAQ"
ACTION_DIR = f"{DATASET_DIR}/Action"
COMPLEX_DIR = f"{DATASET_DIR}/Complex"
FAQ_CSV = f"{FAQ_DIR}/tickets_faq.csv"
ACTION_CSV = f"{ACTION_DIR}/tickets_action.csv"
COMPLEX_CSV = f"{COMPLEX_DIR}/tickets_complex.csv"


def main():
    # ── Create output directories ────────────────────────────────────
    for d in [FAQ_DIR, ACTION_DIR, COMPLEX_DIR]:
        os.makedirs(d, exist_ok=True)

    # ── Load datasets ────────────────────────────────────────────────
    print("Loading datasets…")
    df_filtered = pd.read_csv(FILTERED_CSV)
    df_kaggle = pd.read_csv(KAGGLE_CSV)

    print(f"  classified_tickets.csv : {len(df_filtered):,} rows")
    print(f"  classified_kaggle.csv  : {len(df_kaggle):,} rows")

    # ── Normalize columns: keep only text + intent ───────────────────
    # Filtered dataset uses "Body", Kaggle uses "Document"
    df_filtered = df_filtered[["Body", "intent"]].rename(columns={"Body": "ticket_text"})
    df_kaggle = df_kaggle[["Document", "intent"]].rename(columns={"Document": "ticket_text"})

    # ── Combine ──────────────────────────────────────────────────────
    combined = pd.concat([df_filtered, df_kaggle], ignore_index=True)
    print(f"\nCombined total: {len(combined):,} rows")

    # ── Remove Error rows ────────────────────────────────────────────
    error_count = (combined["intent"] == "Error").sum()
    combined = combined[combined["intent"] != "Error"].reset_index(drop=True)
    print(f"Removed {error_count:,} Error rows → {len(combined):,} valid rows")

    # ── Save combined dataset ────────────────────────────────────────
    combined.to_csv(COMBINED_CSV, index=False)
    print(f"\n✔ Saved combined dataset → {COMBINED_CSV}")

    # ── Split by intent ──────────────────────────────────────────────
    for intent, path in [("FAQ", FAQ_CSV), ("Action", ACTION_CSV), ("Complex", COMPLEX_CSV)]:
        subset = combined[combined["intent"] == intent].reset_index(drop=True)
        subset.to_csv(path, index=False)
        print(f"✔ Saved {intent:7s} ({len(subset):,} rows) → {path}")

    # ── Summary ──────────────────────────────────────────────────────
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    for intent in ["FAQ", "Action", "Complex"]:
        count = (combined["intent"] == intent).sum()
        pct = count / len(combined) * 100
        print(f"  {intent:8s}: {count:6,}  ({pct:5.1f}%)")
    print(f"  {'TOTAL':8s}: {len(combined):6,}")
    print("=" * 50)


if __name__ == "__main__":
    main()
