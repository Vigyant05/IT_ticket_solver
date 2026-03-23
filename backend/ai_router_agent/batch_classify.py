"""
=======================================================================
  IT Ticket Batch Classifier — Vertex AI Batch Prediction
=======================================================================

Uses Vertex AI Batch Prediction to classify ALL tickets in parallel.
Much faster than one-by-one API calls (minutes instead of hours).

Usage:
  python batch_classify.py \
      --input ../../dataset/IT_tickets_filtered.csv \
      --text-col Body \
      --output classified_tickets.csv

  python batch_classify.py \
      --input ../../dataset/IT_tickets_kaggle.csv \
      --text-col Document \
      --output classified_kaggle.csv
=======================================================================
"""

import os
import sys
import csv
import json
import time
import argparse
import logging
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from google.cloud import storage

# ── Logging ──────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────
GCS_BUCKET = "it-ticket-classifier-batch"
MODEL_ID = "gemini-2.5-flash"
MAX_TEXT_LENGTH = 3000

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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Batch-classify IT tickets via Vertex AI Batch Prediction."
    )
    parser.add_argument("--input", "-i", required=True, help="Input CSV path.")
    parser.add_argument("--text-col", "-t", required=True, help="Text column name.")
    parser.add_argument("--output", "-o", default="classified_tickets.csv", help="Output CSV path.")
    return parser.parse_args()


def upload_to_gcs(local_path: str, bucket_name: str, blob_name: str) -> str:
    """Upload a local file to GCS and return the gs:// URI."""
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    blob.upload_from_filename(local_path)
    uri = f"gs://{bucket_name}/{blob_name}"
    log.info("Uploaded %s → %s", local_path, uri)
    return uri


def download_from_gcs(gcs_prefix: str, local_dir: str) -> list[str]:
    """Download all blobs matching a GCS prefix to a local directory."""
    client = storage.Client()
    # Parse bucket and prefix from gs:// URI
    parts = gcs_prefix.replace("gs://", "").split("/", 1)
    bucket_name = parts[0]
    prefix = parts[1] if len(parts) > 1 else ""

    bucket = client.bucket(bucket_name)
    blobs = list(bucket.list_blobs(prefix=prefix))

    downloaded = []
    os.makedirs(local_dir, exist_ok=True)
    for blob in blobs:
        if blob.name.endswith("/"):
            continue
        local_path = os.path.join(local_dir, os.path.basename(blob.name))
        blob.download_to_filename(local_path)
        downloaded.append(local_path)
        log.info("Downloaded %s → %s", blob.name, local_path)

    return downloaded


def prepare_jsonl(df: pd.DataFrame, text_col: str, output_jsonl: str) -> None:
    """Convert DataFrame rows into a JSONL file for batch prediction."""
    count = 0
    with open(output_jsonl, "w", encoding="utf-8") as f:
        for idx, row in df.iterrows():
            text = str(row.get(text_col, "")).strip()
            if len(text) > MAX_TEXT_LENGTH:
                text = text[:MAX_TEXT_LENGTH] + "…"
            if not text:
                text = "(empty ticket)"

            request = {
                "request": {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{"text": text}],
                        }
                    ],
                    "systemInstruction": {
                        "parts": [{"text": SYSTEM_PROMPT}],
                    },
                    "generationConfig": {
                        "responseMimeType": "application/json",
                        "temperature": 0.0,
                        "maxOutputTokens": 1024,
                    },
                }
            }
            f.write(json.dumps(request) + "\n")
            count += 1

    log.info("Prepared %d requests in %s", count, output_jsonl)


def parse_batch_results(result_files: list[str]) -> list[str]:
    """Parse JSONL result files and extract intent labels in order."""
    labels = []
    for fpath in sorted(result_files):
        with open(fpath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    result = json.loads(line)
                    # Navigate the response structure
                    response = result.get("response", {})
                    candidates = response.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            raw_text = parts[0].get("text", "").strip()
                            parsed = json.loads(raw_text)
                            label = parsed.get("intent", "Error")
                            if label in {"FAQ", "Action", "Complex"}:
                                labels.append(label)
                            else:
                                labels.append("Error")
                        else:
                            labels.append("Error")
                    else:
                        labels.append("Error")
                except (json.JSONDecodeError, KeyError, IndexError) as e:
                    log.warning("Failed to parse result line: %s", e)
                    labels.append("Error")
    return labels


def main() -> None:
    args = parse_args()

    # ── Load environment ─────────────────────────────────────────────
    env_path = Path(__file__).resolve().parent / ".env"
    load_dotenv(dotenv_path=env_path)

    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

    if not project_id:
        sys.exit("✘  Set GOOGLE_CLOUD_PROJECT in your .env file.")

    # ── Read input CSV ───────────────────────────────────────────────
    log.info("Reading %s …", args.input)
    df = pd.read_csv(args.input)

    if args.text_col not in df.columns:
        sys.exit(f"✘  Column '{args.text_col}' not found. Available: {list(df.columns)}")

    total_rows = len(df)
    log.info("Total rows: %d", total_rows)

    # ── Step 1: Prepare JSONL ────────────────────────────────────────
    timestamp = int(time.time())
    job_name = f"ticket-classify-{timestamp}"
    jsonl_local = f"/tmp/{job_name}-input.jsonl"

    log.info("Step 1/4: Preparing JSONL input file…")
    prepare_jsonl(df, args.text_col, jsonl_local)

    # ── Step 2: Upload to GCS ────────────────────────────────────────
    log.info("Step 2/4: Uploading to GCS…")
    input_uri = upload_to_gcs(
        jsonl_local, GCS_BUCKET, f"batch-jobs/{job_name}/input.jsonl"
    )
    output_uri_prefix = f"gs://{GCS_BUCKET}/batch-jobs/{job_name}/output/"

    # ── Step 3: Submit batch job ─────────────────────────────────────
    log.info("Step 3/4: Submitting batch prediction job…")

    import vertexai
    from vertexai.preview.batch_prediction import BatchPredictionJob

    vertexai.init(project=project_id, location=location)

    batch_job = BatchPredictionJob.submit(
        source_model=MODEL_ID,
        input_dataset=input_uri,
        output_uri_prefix=output_uri_prefix,
    )

    log.info("Batch job submitted: %s", batch_job.display_name)
    log.info("Job resource name: %s", batch_job.resource_name)
    log.info("Waiting for completion (this may take 5-20 minutes)…")

    # Poll until done
    while not batch_job.has_ended:
        time.sleep(30)  # poll every 30 seconds
        batch_job.refresh()
        log.info("  Job state: %s", batch_job.state.name)

    if batch_job.has_succeeded:
        log.info("✔  Batch job completed successfully!")
    else:
        log.error("✘  Batch job failed with state: %s", batch_job.state.name)
        if batch_job.error:
            log.error("Error details: %s", batch_job.error)
        sys.exit(1)

    # ── Step 4: Download and parse results ───────────────────────────
    log.info("Step 4/4: Downloading and parsing results…")
    result_dir = f"/tmp/{job_name}-output"
    result_files = download_from_gcs(output_uri_prefix, result_dir)

    if not result_files:
        sys.exit("✘  No result files found in GCS output.")

    labels = parse_batch_results(result_files)
    log.info("Parsed %d labels from results.", len(labels))

    # ── Build output CSV ─────────────────────────────────────────────
    if len(labels) != total_rows:
        log.warning(
            "Label count (%d) != row count (%d). Padding with 'Error'.",
            len(labels), total_rows,
        )
        while len(labels) < total_rows:
            labels.append("Error")

    df["intent"] = labels[:total_rows]
    df.to_csv(args.output, index=False, encoding="utf-8")
    log.info("✔  Classification complete → %s", args.output)

    # Print summary
    print("\n" + "=" * 50)
    print("CLASSIFICATION SUMMARY")
    print("=" * 50)
    for label in ["FAQ", "Action", "Complex", "Error"]:
        count = (df["intent"] == label).sum()
        pct = count / total_rows * 100
        print(f"  {label:8s}: {count:6d}  ({pct:5.1f}%)")
    print("=" * 50)


if __name__ == "__main__":
    main()
