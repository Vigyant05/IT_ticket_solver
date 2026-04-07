from pathlib import Path
from ingest import load_multiple_datasets, create_chunks
from embed import generate_embeddings
from db import store_embeddings

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "dataset" / "RAG_data"

def run_pipeline():
    print("🚀 Starting pipeline...")

    file_paths = [
        str(DATA_DIR / "aa_dataset-tickets-english-only.csv"),
        str(DATA_DIR / "rag_ticket_data.csv"),
        str(DATA_DIR / "synthetic_it_support_tickets.csv"),
    ]

    print("📂 Loading datasets...")
    df = load_multiple_datasets(file_paths)

    print(f"✅ Total records loaded: {len(df)}")

    print("✂️ Creating chunks...")
    chunks = create_chunks(df)

    print("🔢 Generating embeddings...")
    embeddings = generate_embeddings(chunks)

    print("💾 Storing in DB...")
    store_embeddings(chunks, embeddings)

    print("✅ DONE!")


if __name__ == "__main__":
    run_pipeline()