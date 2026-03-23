"""
Recovery script: reconnects to an existing batch job, waits for completion,
downloads results, and creates the output CSV.
"""
import os
import sys
import json
import time
import logging
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from google.cloud import storage

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)-8s  %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger(__name__)

# ── Config ───────────────────────────────────────────────────────────
JOB_RESOURCE = "projects/992236211865/locations/us-central1/batchPredictionJobs/1692969300836483072"
INPUT_CSV = "../../dataset/IT_tickets_kaggle.csv"
TEXT_COL = "Document"
OUTPUT_CSV = "classified_kaggle.csv"
GCS_BUCKET = "it-ticket-classifier-batch"


def download_from_gcs(gcs_prefix, local_dir):
    client = storage.Client()
    parts = gcs_prefix.replace("gs://", "").split("/", 1)
    bucket = client.bucket(parts[0])
    prefix = parts[1] if len(parts) > 1 else ""
    blobs = list(bucket.list_blobs(prefix=prefix))
    downloaded = []
    os.makedirs(local_dir, exist_ok=True)
    for blob in blobs:
        if blob.name.endswith("/"):
            continue
        local_path = os.path.join(local_dir, os.path.basename(blob.name))
        blob.download_to_filename(local_path)
        downloaded.append(local_path)
        log.info("Downloaded %s", blob.name)
    return downloaded


def parse_results(result_files):
    labels = []
    for fpath in sorted(result_files):
        with open(fpath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    result = json.loads(line)
                    response = result.get("response", {})
                    candidates = response.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            raw = parts[0].get("text", "").strip()
                            parsed = json.loads(raw)
                            label = parsed.get("intent", "Error")
                            labels.append(label if label in {"FAQ", "Action", "Complex"} else "Error")
                        else:
                            labels.append("Error")
                    else:
                        labels.append("Error")
                except (json.JSONDecodeError, KeyError, IndexError):
                    labels.append("Error")
    return labels


def main():
    env_path = Path(__file__).resolve().parent / ".env"
    load_dotenv(dotenv_path=env_path)

    import vertexai
    from vertexai.preview.batch_prediction import BatchPredictionJob

    vertexai.init(project="project-db08b034-fc27-4dcb-a4c", location="us-central1")

    log.info("Reconnecting to batch job: %s", JOB_RESOURCE)
    job = BatchPredictionJob(JOB_RESOURCE)
    log.info("Current state: %s", job.state.name)

    # Wait if still running
    while not job.has_ended:
        log.info("  Job state: %s — waiting 60s…", job.state.name)
        time.sleep(60)
        job.refresh()

    if not job.has_succeeded:
        log.error("Job failed: %s", job.state.name)
        sys.exit(1)

    log.info("✔ Job succeeded! Downloading results…")
    output_location = job.output_location
    log.info("Output location: %s", output_location)

    result_dir = "/tmp/kaggle-batch-recovery"
    result_files = download_from_gcs(output_location, result_dir)

    if not result_files:
        sys.exit("No result files found!")

    labels = parse_results(result_files)
    log.info("Parsed %d labels", len(labels))

    # Build CSV
    df = pd.read_csv(INPUT_CSV)
    total = len(df)

    if len(labels) != total:
        log.warning("Label count (%d) != row count (%d). Padding.", len(labels), total)
        while len(labels) < total:
            labels.append("Error")

    df["intent"] = labels[:total]
    df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8")
    log.info("✔ Saved → %s", OUTPUT_CSV)

    print("\n" + "=" * 50)
    print("CLASSIFICATION SUMMARY")
    print("=" * 50)
    for label in ["FAQ", "Action", "Complex", "Error"]:
        count = (df["intent"] == label).sum()
        pct = count / total * 100
        print(f"  {label:8s}: {count:6d}  ({pct:5.1f}%)")
    print("=" * 50)


if __name__ == "__main__":
    main()
