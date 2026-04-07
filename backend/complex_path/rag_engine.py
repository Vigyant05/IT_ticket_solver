import json
import os
import faiss
import numpy as np
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-3-flash-preview')

class RAGService:
    def __init__(self, kb_path: str = "knowledge_base.json"):
        self.kb_path = kb_path
        self.embeddings_cache = {}
        self.kb_data = []
        self.index = None
        self.load_kb()

    def get_embedding(self, text: str):
        # Auto-detect first available embedding model
        if not hasattr(self, 'model_name'):
            available = [m.name for m in genai.list_models() if 'embedContent' in m.supported_generation_methods]
            self.model_name = available[0] if available else "models/embedding-001"
            print(f"RAG Engine: Using model {self.model_name}")

        result = genai.embed_content(
            model=self.model_name,
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']

    def load_kb(self):
        if not os.path.exists(self.kb_path):
            print(f"Error: Knowledge base file {self.kb_path} not found.")
            return

        with open(self.kb_path, "r") as f:
            self.kb_data = json.load(f)

        # Create Index
        sentences = [f"{item['issue']} : {item['resolution']}" for item in self.kb_data]
        
        # Pull embeddings from Gemini API
        print(f"RAG Engine: Fetching embeddings for {len(sentences)} items...")
        embeddings = []
        for s in sentences:
            embeddings.append(self.get_embedding(s))
        
        embeddings_np = np.array(embeddings).astype('float32')
        dimension = embeddings_np.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings_np)
        print(f"RAG Engine: Successfully indexed {len(sentences)} items with Gemini Embeddings.")

    def search(self, query: str, k: int = 1):
        if not self.index:
            return []
        
        # Use query embedding task type
        query_embedding = genai.embed_content(
            model=getattr(self, 'model_name', "models/embedding-001"),
            content=query,
            task_type="retrieval_query"
        )['embedding']
        
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
        
        # 2. Prompt Gemini for a refined resolution
        prompt = f"""
        You are an IT Support AI. Use the provided context from historical tickets to propose a resolution for the new ticket.
        
        New Ticket: {ticket_text}
        
        Historical Context:
        {context}
        
        If the confidence is high and it matches a common issue, provide step-by-step resolution steps.
        If not, suggest initial troubleshooting steps for the agent.
        Return your answer as professional markdown.
        """
        
        response = model.generate_content(prompt)
        return response.text

if __name__ == "__main__":
    rag = RAGService()
    test_issue = "My password is not working for the laptop login."
    resolution = rag.resolve_ticket(test_issue)
    print("AI Suggested Resolution:")
    print(resolution)
