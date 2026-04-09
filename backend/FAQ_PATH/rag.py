from embed import model
from db import get_collection
from google import genai
import os

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL = "gemini-3-flash-preview"

# Get DB collection
collection = get_collection()


# Step 1: Retrieve relevant documents
def retrieve_docs(query, top_k=3):
    query_embedding = model.encode([query])[0]

    results = collection.query(
        query_embeddings=[query_embedding.tolist()],
        n_results=top_k
    )

    docs = results.get("documents", [[]])[0]
    return docs


# Step 2: Generate answer using LLM
def generate_answer(query, docs):
    context = "\n".join(docs)

    prompt = f"""
You are an IT support assistant.

Use the context below to answer the user's question.

Context:
{context}

Question:
{query}

Answer clearly and concisely:
"""

    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt
    )

    return response.text


# Combined function (optional)
def rag_pipeline(query):
    docs = retrieve_docs(query)
    answer = generate_answer(query, docs)

    return {
        "query": query,
        "retrieved_docs": docs,
        "answer": answer
    }