# 🎫 Intelligent IT Support Ticket System

An automated IT support ticket triage and routing platform powered by **Google Gemini AI** and **RAG (Retrieval-Augmented Generation)**. This system automatically classifies incoming tickets, assigns them to the best-suited agent based on skills and workload, and suggests automated resolutions for common issues.

## 🚀 Key Features

*   **🧠 AI-Driven Triage**: Uses Gemini 1.5/3 Pro/Flash to analyze ticket text, determine category (e.g., Security, DevOps), severity (1-5), and required skills.
*   **📡 Dynamic Routing**: Deterministically routes tickets to employees based on expertise matching, team availability, and current workload.
*   **💡 RAG Auto-Resolution**: Leverages a knowledge base with FAISS and Gemini Embeddings to suggest solutions for recurring technical problems.
*   **📊 Integrated Dashboard**: Interactive real-time view of agents and ticket statuses.
*   **⚡ High Performance**: Built with FastAPI and SQLAlchemy for a responsive and scalable backend.

---

## 🛠️ Tech Stack

*   **Backend**: FastAPI (Python)
*   **Database**: SQLite (SQLAlchemy ORM)
*   **AI Models**: Google Gemini 1.5/3 (Generative AI & Embeddings)
*   **Vector Search**: FAISS
*   **Frontend**: HTML5/Vanilla JS/CSS

---

## 🏗️ Project Architecture

1.  **Ticket Ingestion**: User submits a ticket (`Title` + `Description`).
2.  **LLM Analysis**: `llm_router.py` classifies the ticket (Severity, Category, Subcategory).
3.  **Intelligent Routing**: `routing_engine.py` finds the best available agent with matching skills.
4.  **RAG Suggestion**: `rag_engine.py` searches the KB for historical similar issues and suggests a fix.
5.  **Status Tracking**: Agents can resolve tickets, updating their workload in real-time.

---

## ⚙️ Setup & Installation

### 1. Prerequisite: API Configuration
Create a `.env` file in the root directory and add your Google AI Studio API key:
```env
GEMINI_API_KEY = "YOUR_GOOGLE_API_KEY"
```

### 2. Quick Start - Automated (Windows)
Double-click the **`Run_Project.bat`** file. It will:
1.  Install all required dependencies.
2.  Seed the database with initial employees (`seed_data.py`).
3.  Start the FastAPI server on `http://127.0.0.1:8000`.

### 3. Manual Installation (Terminal)
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Seed initial data (Employees & Teams)
python seed_data.py

# 3. Start the application
uvicorn main:app --reload
```

---

## 🔍 Monitoring & API Docs

Once the server is running, explore the API:
*   **Interactive Dashboard**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
*   **Swagger API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
*   **Database**: Tables are saved locally in `it_tickets.db`.

---

## 📁 File Structure
- `main.py`: Entry point for the FastAPI application.
- `models.py`: Database schema definitions (Employees, Tickets).
- `llm_router.py`: Logic for ticket classification using Gemini.
- `routing_engine.py`: Logic for assigning tickets to agents.
- `rag_engine.py`: FAISS-based knowledge retrieval and auto-resolution.
- `seed_data.py`: Initial data setup for testing teams and skills.
- `index.html`: The frontend dashboard.
- `database.py`: SQLAlchemy connection and session management.
