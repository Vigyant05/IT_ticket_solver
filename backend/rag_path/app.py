from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import chromadb
from sentence_transformers import SentenceTransformer
from langchain_google_genai import ChatGoogleGenerativeAI
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
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    llm = ChatGoogleGenerativeAI(model="gemini-3-flash-preview", google_api_key=api_key)
else:
    llm = None
    print("WARNING: GEMINI_API_KEY is not set in environment. Answer generation will fallback to only returning retrieved text.")

# Define the RAG prompt
template = """
You are an IT Support Resolution Assistant. You have been provided with the following similar past tickets and their solutions.
Use this context to formulate a helpful, professional, and clear response to the user's current query.
If the context doesn't have the answer, just give your best IT support advice, but prioritize the context.

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
def format_docs(docs_data):
    formatted = []
    for doc, meta in zip(docs_data['documents'][0], docs_data['metadatas'][0]):
        # doc is the issue body, meta contains the past answer
        formatted.append(f"Past Issue: {doc}\nSolution Provided: {meta.get('answer', 'No solution recorded.')}")
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
                "llm_used": True
            }
        else:
            # Fallback if no LLM key
            return {
                "user_query": req.question,
                "retrieved_context": context_text,
                "generated_answer": "NO API KEY SET: Here is what I found in the database. (Please set GEMINI_API_KEY to enable AI generative answers).\n\n" + context_text,
                "llm_used": False
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
