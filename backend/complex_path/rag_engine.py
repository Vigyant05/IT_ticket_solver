import json
import os
import faiss
import numpy as np
from ollama import Client
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

# Configure Ollama Cloud
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")
MODEL_ID = "qwen3.5"

if not OLLAMA_API_KEY:
    print("WARNING: OLLAMA_API_KEY is not set. LLM calls will fail.")

ollama_client = Client(
    host="https://ollama.com",
    headers={"Authorization": f"Bearer {OLLAMA_API_KEY}"},
)

# Use sentence-transformers for embeddings (runs locally, lightweight)
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
print(f"RAG Engine: Using Ollama Cloud model {MODEL_ID} for generation")
print(f"RAG Engine: Using sentence-transformers/all-MiniLM-L6-v2 for embeddings")

class RAGService:
    def __init__(self, kb_path: str = "knowledge_base.json"):
        self.kb_path = kb_path
        self.kb_data = []
        self.index = None
        self.load_kb()

    def get_embedding(self, text: str):
        return embedding_model.encode(text).tolist()

    def load_kb(self):
        if not os.path.exists(self.kb_path):
            print(f"Error: Knowledge base file {self.kb_path} not found.")
            return

        with open(self.kb_path, "r") as f:
            self.kb_data = json.load(f)

        # Create Index
        sentences = [f"{item['issue']} : {item['resolution']}" for item in self.kb_data]
        
        # Pull embeddings using sentence-transformers
        print(f"RAG Engine: Fetching embeddings for {len(sentences)} items...")
        embeddings = embedding_model.encode(sentences)
        
        embeddings_np = np.array(embeddings).astype('float32')
        dimension = embeddings_np.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings_np)
        print(f"RAG Engine: Successfully indexed {len(sentences)} items.")

    def search(self, query: str, k: int = 1):
        if not self.index:
            return []
        
        query_embedding = embedding_model.encode(query)
        query_vector = np.array([query_embedding]).astype('float32')
        distances, indices = self.index.search(query_vector, k)
        
        results = []
        for idx in indices[0]:
            if idx < len(self.kb_data) and idx != -1:
                results.append(self.kb_data[idx])
        return results

    def resolve_ticket(self, ticket_text: str):
        # 1. Search for similar cases
        similar_cases = self.search(ticket_text, k=2)
        
        context = "\n".join([f"Case: {c['issue']}\nResolution: {c['resolution']}" for c in similar_cases])
        
        # 2. Prompt Ollama Cloud for a refined resolution
        prompt = f"""
        You are an IT Support AI. Use the provided context from historical tickets to propose a resolution for the new ticket.
        
        New Ticket: {ticket_text}
        
        Historical Context:
        {context}
        
        If the confidence is high and it matches a common issue, provide step-by-step resolution steps.
        If not, suggest initial troubleshooting steps for the agent.
        Return your answer as professional markdown.
        """
        
        response = ollama_client.chat(
            model=MODEL_ID,
            messages=[
                {"role": "user", "content": prompt},
            ],
        )
        return response.message.content

if __name__ == "__main__":
    rag = RAGService()
    test_issue = "My password is not working for the laptop login."
    resolution = rag.resolve_ticket(test_issue)
    print("AI Suggested Resolution:")
    print(resolution)
