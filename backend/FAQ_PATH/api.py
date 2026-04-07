from fastapi import FastAPI
from pydantic import BaseModel

from rag import retrieve_docs, generate_answer
from embed import model
from db import get_collection

# Initialize FastAPI app
app = FastAPI(title="IT FAQ RAG API")

# Get Chroma collection
collection = get_collection()


# -------------------------------
# 🔹 Request Models
# -------------------------------
class QueryRequest(BaseModel):
    query: str


class AddDataRequest(BaseModel):
    text: str


# -------------------------------
# 🔹 Health Check
# -------------------------------
@app.get("/")
def root():
    return {"message": "✅ IT FAQ RAG API is running"}


# -------------------------------
# 🔹 Ask Question (RAG)
# -------------------------------
@app.post("/ask")
def ask_question(request: QueryRequest):
    query = request.query

    # Step 1: Retrieve relevant docs
    docs = retrieve_docs(query)

    # Step 2: Generate answer using LLM
    answer = generate_answer(query, docs)

    return {
        "query": query,
        "retrieved_docs": docs,
        "answer": answer
    }


# -------------------------------
# 🔹 Add New Data (REAL-TIME DB UPDATE)
# -------------------------------
@app.post("/add")
def add_data(request: AddDataRequest):
    text = request.text

    # Generate embedding
    embedding = model.encode([text])[0]

    # Generate unique ID
    new_id = str(collection.count())

    # Add to ChromaDB
    collection.add(
        documents=[text],
        embeddings=[embedding.tolist()],
        ids=[new_id]
    )

    return {
        "message": "✅ Data added successfully",
        "id": new_id,
        "text": text
    }


# -------------------------------
# 🔹 View Stored Data (Optional Debug)
# -------------------------------
@app.get("/view")
def view_data(limit: int = 100):
    data = collection.get(limit=limit)

    return {
        "total_docs": collection.count(),
        "documents": data.get("documents", [])
    }