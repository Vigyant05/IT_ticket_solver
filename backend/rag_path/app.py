from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import chromadb
from sentence_transformers import SentenceTransformer
from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="IT Ticket RAG Pipeline", description="RAG and Vector DB API for Team Member 2")

# --- Globals and Initialization ---
DB_DIR = "vector_db"
client = chromadb.PersistentClient(path=DB_DIR)
collection = client.get_or_create_collection("it_tickets")
model = SentenceTransformer('all-MiniLM-L6-v2')

# Setup LLM based on environment key
api_key = os.getenv("OLLAMA_API_KEY")
if api_key:
    llm = ChatOllama(
        base_url="https://ollama.com",
        model="qwen3.5",
        client_kwargs={"headers": {"Authorization": f"Bearer {api_key}"}},
    )
else:
    llm = None
    print("WARNING: OLLAMA_API_KEY is not set in environment. Answer generation will fallback to only returning retrieved text.")

# Define the RAG prompt
template = """
You are an IT Support Resolution Assistant. You have been provided with the following similar past tickets and their solutions.
Use this context to formulate a helpful, professional, and clear response to the user's current query.

CRITICAL RULES:
1. Prioritize the provided context to answer the user's query.
2. If the context says 'No relevant past tickets found.', rely on your general IT knowledge to provide best-effort support.
3. If the provided context does not contain a definitive technical solution (e.g., it just says 'assessing the problem' or 'let's schedule a meeting'), politely inform the user that their issue has been escalated to Tier 2 support for further investigation.

Context (Past Tickets & Solutions):
{context}

User's Query:
{query}

Helpful Answer:
"""
rag_prompt = PromptTemplate.from_template(template)

# --- Pydantic Models for API ---
class QueryRequest(BaseModel):
    question: str
    n_results: int = 3

class AppendRequest(BaseModel):
    subject: str
    body: str
    answer: str
    type: str = "Incident"
    priority: str = "medium"

# --- RAG Core Logic ---
def format_docs(docs_data, threshold=0.8):
    formatted = []
    docs = docs_data.get('documents', [[]])[0]
    metas = docs_data.get('metadatas', [[]])[0]
    distances = docs_data.get('distances', [[]])[0]
    
    for doc, meta, dist in zip(docs, metas, distances):
        # Only include documents that are semantically close to the query
        if dist > threshold:
            continue
        formatted.append(f"Past Issue: {doc}\nSolution Provided: {meta.get('answer', 'No solution recorded.')}")
        
    if not formatted:
        return "No relevant past tickets found."
        
    return "\n\n---\n\n".join(formatted)


# --- Endpoints ---

@app.post("/query")
async def generate_answer(req: QueryRequest):
    """
    RAG Pipeline Node: Query the DB and feed context + question to LLM.
    """
    try:
         # 1. Embed user query using the same embedding model
        query_embedding = model.encode([req.question]).tolist()
        
        # 2. Query Vector Database for most relevant documents
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=req.n_results
        )
        
        # 3. Format the retrieved context
        context_text = format_docs(results)
        
        # Extract metrics for logging/debugging
        distances = results.get('distances', [[]])[0]
        retrieved_ids = results.get('ids', [[]])[0]
        metrics = {
            "num_retrieved": len(retrieved_ids),
            "distances": distances,
            "retrieved_ids": retrieved_ids,
            "min_distance": min(distances) if distances else None,
            "avg_distance": sum(distances)/len(distances) if distances else None
        }
        
        # 4. Generate Final Answer
        if llm:
            chain = (
                {"context": lambda x: context_text, "query": lambda x: x}
                | rag_prompt
                | llm
                | StrOutputParser()
            )
            final_answer = chain.invoke(req.question)
            
            return {
                "user_query": req.question,
                "retrieved_context": context_text,
                "generated_answer": final_answer,
                "llm_used": True,
                "metrics": metrics
            }
        else:
            # Fallback if no LLM key
            return {
                "user_query": req.question,
                "retrieved_context": context_text,
                "generated_answer": "NO API KEY SET: Here is what I found in the database. (Please set OLLAMA_API_KEY to enable AI generative answers).\n\n" + context_text,
                "llm_used": False,
                "metrics": metrics
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/append_ticket")
async def append_ticket(req: AppendRequest):
    """
    Real-Time Vector DB Endpoint: Accepts formatted text, generates embedding, and appends to live DB.
    """
    try:
        # Create a document from the subject and body
        document = f"Subject: {req.subject}\nBody: {req.body}"
        
        # Generate embedding
        embedding = model.encode([document]).tolist()
        
        # Create metadata
        metadata = {
            "answer": req.answer,
            "type": req.type,
            "priority": req.priority,
            "subject": req.subject
        }
        
        # Generate a new unique ID (could be more robust with UUIDs)
        ticket_id = f"realtime_{collection.count() + 1}"
        
        # Append to ChromaDB
        collection.add(
            documents=[document],
            embeddings=embedding,
            metadatas=[metadata],
            ids=[ticket_id]
        )
        
        return {
            "status": "success",
            "message": "Ticket successfully embedded and added to live vector database.",
            "ticket_id": ticket_id
        }
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "IT Ticket RAG Pipeline API running. Go to /docs to see the specific endpoints."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
