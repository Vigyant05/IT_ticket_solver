"""
Test script: Pick 8 random tickets from tickets_faq.csv and run them through the RAG pipeline.
Prints retrieved context + generated answer for analysis.
"""
import pandas as pd
import chromadb
from sentence_transformers import SentenceTransformer
from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
import os
import random
import json
import time

load_dotenv()

# ---- Setup (mirrors app.py exactly) ----
DB_DIR = "vector_db"
client = chromadb.PersistentClient(path=DB_DIR)
collection = client.get_or_create_collection("it_tickets")
embed_model = SentenceTransformer('all-MiniLM-L6-v2')

api_key = os.getenv("OLLAMA_API_KEY")
# Use same model as app.py
llm = ChatOllama(
    base_url="https://ollama.com",
    model="qwen3.5",
    client_kwargs={"headers": {"Authorization": f"Bearer {api_key}"}},
)

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

def call_llm_with_retry(chain, query, max_retries=3, base_delay=15):
    """Call LLM with exponential backoff retry."""
    for attempt in range(max_retries):
        try:
            return chain.invoke(query)
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                wait_time = base_delay * (2 ** attempt)
                print(f"  Rate limited (attempt {attempt+1}/{max_retries}). Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                return f"LLM ERROR: {e}"
    return "LLM ERROR: Max retries exceeded due to rate limiting."

# ---- Load test tickets ----
print("="*80)
print("LOADING TEST TICKETS FROM tickets_faq.csv")
print("="*80)
df = pd.read_csv("../../dataset/FAQ/tickets_faq.csv")
print(f"Total tickets in CSV: {len(df)}")
print(f"Columns: {list(df.columns)}")
print(f"Intent distribution:\n{df['intent'].value_counts()}")

# Pick 8 random tickets
random.seed(42)  # Removed seed so it picks a completely new random batch every time
sample_indices = random.sample(range(len(df)), 8)
sample_tickets = df.iloc[sample_indices]

print(f"\nSelected {len(sample_tickets)} random tickets (indices: {sample_indices})")
print(f"Vector DB collection count: {collection.count()} documents")
print("="*80)

# ---- Run pipeline on each ticket ----
results = []
for i, (idx, row) in enumerate(sample_tickets.iterrows()):
    ticket_text = row['ticket_text']
    intent = row['intent']
    
    # Truncate for display
    query_preview = ticket_text[:200] + "..." if len(ticket_text) > 200 else ticket_text
    
    print(f"\n{'#'*80}")
    print(f"TEST {i+1}/8  |  CSV Row: {idx}  |  Intent Label: {intent}")
    print(f"{'#'*80}")
    print(f"\nQUERY (first 200 chars):\n{query_preview}\n")
    
    # 1. Embed query
    query_embedding = embed_model.encode([ticket_text]).tolist()
    
    # 2. Query vector DB
    db_results = collection.query(
        query_embeddings=query_embedding,
        n_results=3
    )
    
    # 3. Format context
    context_text = format_docs(db_results)
    
    # 4. Get distances (similarity scores)
    distances = db_results.get('distances', [[]])[0]
    retrieved_ids = db_results.get('ids', [[]])[0]
    
    print(f"RETRIEVED DOCUMENTS ({len(retrieved_ids)} results):")
    for j, (rid, dist) in enumerate(zip(retrieved_ids, distances)):
        print(f"  [{j+1}] ID: {rid}  |  Distance: {dist:.4f}")
    
    # 5. Generate answer via LLM
    chain = (
        {"context": lambda x: context_text, "query": lambda x: x}
        | rag_prompt
        | llm
        | StrOutputParser()
    )
    final_answer = call_llm_with_retry(chain, ticket_text)
    
    print(f"\nRETRIEVED CONTEXT (first 500 chars):")
    print(context_text[:500] + ("..." if len(context_text) > 500 else ""))
    
    print(f"\nGENERATED ANSWER:")
    print(final_answer)
    
    results.append({
        "test_num": i+1,
        "csv_row": idx,
        "intent": intent,
        "query_preview": query_preview,
        "distances": distances,
        "retrieved_ids": retrieved_ids,
        "context_preview": context_text[:500],
        "generated_answer": final_answer
    })
    
    # Delay between requests to avoid rate limiting
    time.sleep(5)

print("\n" + "="*80)
print("ALL 8 TESTS COMPLETE")
print("="*80)

# Summary statistics
print("\n--- DISTANCE SUMMARY ---")
all_distances = [d for r in results for d in r['distances'] if d is not None]
if all_distances:
    print(f"Min distance: {min(all_distances):.4f}")
    print(f"Max distance: {max(all_distances):.4f}")
    print(f"Avg distance: {sum(all_distances)/len(all_distances):.4f}")
else:
    print("Min distance: N/A (no results retrieved)")
    print("Max distance: N/A (no results retrieved)")
    print("Avg distance: N/A (no results retrieved)")
    print("\nWARNING: Your vector database appears to be empty! Please make sure to run the ingestion script before testing the RAG pipeline.")

# Save results to JSON for analysis
output_path = "rag_test_results.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print(f"\nResults saved to {output_path}")
