# IT Ticket Solver

This repository contains the backend automation system for routing and resolving IT tickets. The system is split into multiple paths based on ticket complexity.

## 1. AI Router Agent (Central Dispatcher)
Classifies incoming tickets into `FAQ`, `Action`, or `Complex`.

**Setup:**
1. Navigate to `backend/ai_router_agent`
2. Create a `.env` file and add your Groq key: `GROQ_API_KEY=your_key_here`
3. Install dependencies: `pip install -r requirements.txt` (or install `groq`, `python-dotenv`)

**Run:**
- Test a single ticket: `python router_agent.py "I need a password reset"`
- Test a batch: `python router_agent.py --csv test_tickets.csv`

---

## 2. Complex Path (Intelligent Routing Engine)
Handles severe/complex tickets by routing them to human experts based on skill matching and workload balance using Groq's LPU.

**Setup:**
1. Navigate to `backend/complex_path`
2. Create a `.env` file and add your Groq key: `GROQ_API_KEY=your_key_here`
3. Install requirements (FastAPI, SQLAlchemy, Groq, etc.)

**Run:**
- Run the evaluation metric test on 20 real tickets: `python metric_eval.py --real 20`
- Or run the main API: `uvicorn main:app --reload`

---

## 3. Action Path (n8n Automation)
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

## 4. RAG Path (FAQ / Knowledge Base)
Answers FAQ tickets by retrieving solutions from past tickets stored in a local vector database.

**Setup:**
1. Navigate to `backend/rag_path`
2. Create a `.env` file and add your Ollama Cloud key: `OLLAMA_API_KEY=your_key_here`
3. Install dependencies (FastAPI, ChromaDB, Langchain, etc.)
4. Load your initial historical ticket data into the vector database by running:
   `python ingest_data.py`

**Run:**
- Start the Retrieval-Augmented Generation API server:
  `uvicorn app:app --reload`
- The API will run on `http://localhost:8000`. You can test the endpoints interactively by going to `http://localhost:8000/docs` in your browser.
