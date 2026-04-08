import requests

try:
    res = requests.get("http://localhost:8000/tickets")
    print(f"Tickets Response ({res.status_code}):")
    print(res.json())
except Exception as e:
    print(f"Error connecting to backend: {e}")

try:
    res = requests.get("http://localhost:8000/employees")
    print(f"\nEmployees Count: {len(res.json())}")
except Exception as e:
    print(f"Error connecting to backend: {e}")
