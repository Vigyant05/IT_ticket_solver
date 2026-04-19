import requests

def test_pipeline():
    print("--- 1. Testing RAG Query Endpoint ---")
    query_payload = {
        "question": "My account is disrupted and I keep getting a 404 page.",
        "n_results": 2
    }
    try:
        response = requests.post("http://localhost:8000/query", json=query_payload)
        print("Status Code:", response.status_code)
        if response.status_code == 200:
            data = response.json()
            print("\nUser Query:", data['user_query'])
            print("\nLLM Used:", data['llm_used'])
            print("\n--- Retrieved Context ---\n", data['retrieved_context'])
            print("\n--- Final Generated Answer ---\n", data['generated_answer'])
        else:
            print("Error:", response.text)
    except Exception as e:
        print("Connection Failed:", e)

    print("\n--- 2. Testing Real-time Append Endpoint ---")
    append_payload = {
        "subject": "Printer not working",
        "body": "Hi, paper is jammed in the 3rd floor office printer.",
        "answer": "Maintenance team has been dispatched to 3rd floor to fix the paper jam. Please use the 4th floor printer in the meantime.",
        "type": "Hardware",
        "priority": "low"
    }
    try:
        response = requests.post("http://localhost:8000/append_ticket", json=append_payload)
        print("Status Code:", response.status_code)
        if response.status_code == 200:
            print("Response:", response.json())
        else:
            print("Error:", response.text)
    except Exception as e:
        print("Connection Failed:", e)

if __name__ == "__main__":
    test_pipeline()
