import pandas as pd
import chromadb
from sentence_transformers import SentenceTransformer
import os

DB_DIR = "vector_db"

def ingest_data():
    print("Loading data...")
    # Using aa_dataset-tickets-english-only because it has clear problem-solution (body-answer) structure.
    df = pd.read_csv("data/aa_dataset-tickets-english-only.csv")
    
    # Fill nan values
    df = df.fillna("")
    
    # We will use the first 500 rows to keep it lightweight for demonstration
    df = df.head(500)
    
    print("Initializing ChromaDB...")
    client = chromadb.PersistentClient(path=DB_DIR)
    
    # We use a collection named "it_tickets"
    collection = client.get_or_create_collection(
        name="it_tickets",
        metadata={"hnsw:space": "cosine"} # Use cosine similarity
    )
    
    print("Loading Sentence Transformer Model (all-MiniLM-L6-v2)...")
    # Using a small, efficient model for sentence embeddings
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    docs = []
    metadatas = []
    ids = []
    embeddings = []
    
    print("Preparing documents for vector DB...")
    for index, row in df.iterrows():
        # The document itself will be the body of the ticket (the user query)
        # So when a user searches a new query, it matches similar past queries
        text = f"Subject: {row['subject']}\nBody: {row['body']}"
        
        # We store the "answer" in metadata so we can retrieve it
        meta = {
            "answer": str(row['answer']),
            "type": str(row['type']),
            "priority": str(row['priority']),
            "subject": str(row['subject'])
        }
        
        doc_id = f"ticket_{index}"
        
        docs.append(text)
        metadatas.append(meta)
        ids.append(doc_id)
        
    print(f"Creating embeddings for {len(docs)} documents...")
    # Generate embeddings
    embeddings = model.encode(docs).tolist()
        
    print("Upserting into ChromaDB...")
    # Add to ChromaDB in batches
    batch_size = 100
    for i in range(0, len(docs), batch_size):
        collection.upsert(
            documents=docs[i:i+batch_size],
            embeddings=embeddings[i:i+batch_size],
            metadatas=metadatas[i:i+batch_size],
            ids=ids[i:i+batch_size]
        )
        print(f"Upserted {min(i+batch_size, len(docs))}/{len(docs)}...")
        
    print("Ingestion complete. Vector DB is ready!")

if __name__ == "__main__":
    ingest_data()
