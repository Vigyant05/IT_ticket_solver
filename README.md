# IT Ticket Solver

This repository contains the backend automation system for routing and resolving IT tickets. The system is split into multiple paths based on ticket complexity, all orchestrated by a **Unified LangGraph Pipeline**.

## Unified Pipeline (Main Entry Point)
The Unified Pipeline uses **LangGraph** to act as the brain. It takes incoming tickets, classifies their intent using an LLM, and instantly routes them to the correct microservice (n8n, Vector DB, or Human Routing Engine).

**Setup Everything:**
1. Navigate to the `backend/` folder.
2. Install all dependencies: `pip install -r requirements.txt`
3. Add your `GROQ_API_KEY` inside `.env` files for `ai_router_agent` and `complex_path`.
4. Add your `OLLAMA_API_KEY` inside the `.env` for `rag_path`.
5. Seed the human expert database: `cd complex_path && python seed_data.py && cd ..`

**Run the Full System:**
Because the paths run as independent microservices, you need **two** terminal windows:
- **Terminal 1 (RAG API):** `cd backend/rag_path` -> `uvicorn app:app --port 8000`
- **Terminal 2 (Main Brain):** `cd backend` -> `uvicorn pipeline:app --port 8080 --reload`

**Test the Pipeline:**
Send a POST request to the brain (port 8080):
```bash
curl -X POST "http://localhost:8080/submit_ticket" \
     -H "Content-Type: application/json" \
     -d '{"ticket_id": "TKT-001", "ticket_text": "Please reset my Active Directory password."}'
```

---

## Individual Microservices

### 1. Complex Path (Intelligent Routing Engine)
Handles severe tickets by routing them to human experts based on skill matching and workload balance using Groq's LPU.

**Setup:**
1. Navigate to `backend/complex_path`
2. Create a `.env` file and add your Groq key: `GROQ_API_KEY=your_key_here`
3. Ensure dependencies are installed.

**Run:**
- Run the evaluation metric test on 20 real tickets: `python metric_eval.py --real 20`
- Or run the standalone API (Port 8001): `uvicorn main:app --port 8001 --reload`

---

### 2. Action Path (n8n Automation)
Executes basic Action tickets (password resets, WiFi fixes, etc.) via local n8n workflows.

**Setup:**
1. Install and run [n8n](https://n8n.io/) locally (e.g., via Docker).
2. Import the `backend/action_path/MiniPrj.json` workflow into n8n.
3. Configure the Groq credentials inside the n8n LLM node.
4. **Important:** Save the workflow and toggle it to **Active** (top right corner).
5. Double-click the "When chat message received" node, click "Webhook URLs", and copy the Production URL.
6. Paste the URL into `DEFAULT_WEBHOOK_URL` inside `backend/action_path/action_pipeline.py`.

**Run:**
- Send a batch of test tickets to n8n: 
  `python action_pipeline.py --csv test_action_tickets.csv --limit 10 --production`

---

### 3. RAG Path (FAQ / Knowledge Base)
Answers FAQ tickets by retrieving solutions from past tickets stored in a local ChromaDB vector database.

**Setup:**
1. Navigate to `backend/rag_path`
2. Create a `.env` file and add your Ollama Cloud key: `OLLAMA_API_KEY=your_key_here`
3. Load your initial historical ticket data into the vector database by running: `python ingest_data.py`

**Run:**
- Start the Retrieval-Augmented Generation API server (Port 8000):
  `uvicorn app:app --port 8000 --reload`
- Test the endpoints interactively at `http://localhost:8000/docs`.

---

### 4. AI Router Agent (Central Dispatcher)
The core Groq-powered classifier used by the Unified Pipeline. 

**Setup:**
1. Navigate to `backend/ai_router_agent`
2. Create a `.env` file and add your Groq key: `GROQ_API_KEY=your_key_here`

**Run:**
- Test a single ticket: `python router_agent.py "I need a password reset"`
- Test a batch: `python router_agent.py --csv test_tickets.csv`
