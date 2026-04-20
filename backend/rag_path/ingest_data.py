import os
import pandas as pd
import chromadb
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

DB_DIR = "vector_db"

def ingest():
    print("Initializing Vector DB and Embedding Model...")
    client = chromadb.PersistentClient(path=DB_DIR)
    collection = client.get_or_create_collection("it_tickets")
    
    # Check if there's already data
    if collection.count() > 0:
        print(f"Collection already has {collection.count()} documents. Skipping clear for now, or you can collection.delete() if you want a fresh start.")
        # Optional: collection.delete(ids=collection.get()['ids'])
    
    model = SentenceTransformer('all-MiniLM-L6-v2')

    documents = []
    embeddings = []
    metadatas = []
    ids = []
    
    # 1. Ingest AA Dataset
    print("\nLoading dataset 1: aa_dataset-tickets-english-only.csv")
    try:
        df1 = pd.read_csv("../../dataset/RAG_data/aa_dataset-tickets-english-only.csv")
        df1 = df1.dropna(subset=['body', 'answer']) # ensure we have content and answer
        
        print(f"Processing {len(df1)} tickets from AA Dataset...")
        for idx, row in tqdm(df1.iterrows(), total=len(df1)):
            subject = str(row.get('subject', 'No Subject'))
            body = str(row['body'])
            answer = str(row['answer'])
            
            # Format matches how app.py appends tickets
            doc_text = f"Subject: {subject}\nBody: {body}"
            
            meta = {
                "answer": answer,
                "type": str(row.get('type', 'Unknown')),
                "priority": str(row.get('priority', 'medium')),
                "subject": subject
            }
            
            documents.append(doc_text)
            metadatas.append(meta)
            ids.append(f"aa_{idx}")
            
    except Exception as e:
        print(f"Error loading AA Dataset: {e}")

    # 2. Ingest RAG Snippet Dataset
    print("\nLoading dataset 2: rag_ticket_data.csv")
    try:
        df2 = pd.read_csv("../../dataset/RAG_data/rag_ticket_data.csv")
        df2 = df2.dropna(subset=['snippet', 'recommendation'])
        
        print(f"Processing {len(df2)} tickets from RAG Snippet Dataset...")
        for idx, row in tqdm(df2.iterrows(), total=len(df2)):
            doc_text = str(row['snippet'])
            answer = str(row['recommendation'])
            
            meta = {
                "answer": answer,
                "type": "Snippet Interaction",
                "priority": "medium",
                "subject": "Interaction Log"
            }
            
            documents.append(doc_text)
            metadatas.append(meta)
            ids.append(f"rag_{idx}")
            
    except Exception as e:
        print(f"Error loading RAG Snippet Dataset: {e}")

    if not documents:
        print("No documents found to ingest!")
        return

    print("\nGenerating Embeddings. This might take a few moments...")
    embeddings = model.encode(documents, show_progress_bar=True).tolist()

    print("\nAdding to ChromaDB...")
    # Add in batches to avoid max payload issues
    batch_size = 5000
    for i in tqdm(range(0, len(documents), batch_size)):
        end = i + batch_size
        collection.add(
            documents=documents[i:end],
            embeddings=embeddings[i:end],
            metadatas=metadatas[i:end],
            ids=ids[i:end]
        )

    print(f"\nSuccessfully ingested! Vector DB now contains {collection.count()} documents.")

if __name__ == '__main__':
    ingest()
