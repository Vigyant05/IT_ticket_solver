import chromadb
from pathlib import Path

# Resolve absolute path for ChromaDB persistence (works from any cwd)
DB_PATH = str(Path(__file__).parent.parent / "db" / "chroma_db")

# Initialize Chroma persistent client (ChromaDB >= 0.4 API)
client = chromadb.PersistentClient(path=DB_PATH)

# Create / get collection
collection = client.get_or_create_collection(name="it_tickets")


def store_embeddings(chunks, embeddings):
    start_index = collection.count()

    ids = []
    batch_size = 5000
    total = len(chunks)
    
    for i in range(0, total, batch_size):
        end_idx = min(i + batch_size, total)
        batch_chunks = chunks[i:end_idx]
        batch_embeddings = [emb.tolist() for emb in embeddings[i:end_idx]]
        batch_ids = [str(start_index + j) for j in range(i, end_idx)]

        collection.add(
            documents=batch_chunks,
            embeddings=batch_embeddings,
            ids=batch_ids
        )
        ids.extend(batch_ids)
        print(f"Stored {end_idx}/{total} documents")

    print(f"Successfully stored {len(ids)} new documents in total.")


def get_collection():
    return collection