import argparse
import csv
import requests
import time
import os

# ==============================================================================
# ⚠️ ACTION REQUIRED: PASTE YOUR N8N WEBHOOK URL BELOW
# Everyone who imports the n8n workflow gets a unique Webhook ID. 
# 1. Double-click the "When chat message received" node in n8n.
# 2. Click "Webhook URLs" and copy the Production URL.
# 3. Publish the n8n Workflow by clicking "PUBLISH" button in top-right corner.
# 4. Paste it inside the quotes below.
# ==============================================================================
DEFAULT_WEBHOOK_URL = "http://localhost:5678/webhook/3029f323-e24b-4aa6-b0ae-44bc0f0c969d/chat"

def send_ticket_to_n8n(ticket_text, webhook_url):
    """Sends a single ticket to the n8n Chat Trigger webhook."""
    print(f"\n[{time.strftime('%H:%M:%S')}] Sending Ticket:")
    print(f"Content: {ticket_text[:100]}..." if len(ticket_text) > 100 else f"Content: {ticket_text}")
    
    # n8n Chat Trigger expects 'action', 'sessionId', and 'chatInput' or just a direct payload depending on the client.
    # The standard payload format for n8n chat webhooks:
    payload = {
        "action": "sendMessage",
        "sessionId": "action_pipeline_session",
        "chatInput": ticket_text
    }
    
    try:
        response = requests.post(webhook_url, json=payload, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        
        n8n_response_text = "Action executed successfully."
        try:
            resp_data = response.json()
            output_data = resp_data.get('output', resp_data)
            
            if isinstance(output_data, dict):
                # Format the dictionary nicely
                lines = []
                if 'action' in output_data: lines.append(f"Action: {output_data['action']}")
                if 'status' in output_data: lines.append(f"Status: {output_data['status']}")
                if 'data' in output_data: lines.append(f"Result: {output_data['data']}")
                if 'logs' in output_data and isinstance(output_data['logs'], list):
                    lines.append("Logs:")
                    for log in output_data['logs']:
                        lines.append(f"- {log}")
                
                n8n_response_text = "\n".join(lines) if lines else str(output_data)
            else:
                n8n_response_text = str(output_data)
                
            print(f"Success! n8n responded: {n8n_response_text}")
        except ValueError:
            print(f"Success! (No JSON returned, status: {response.status_code})")
            
        return True, n8n_response_text
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to n8n workflow: {e}")
        print("Make sure your n8n workflow is running (click 'Execute Workflow' or activate it).")
        return False, str(e)

def process_csv(file_path, webhook_url, max_tickets=None, delay=2.0):
    """Reads tickets from a CSV and sends them one by one to n8n."""
    if not os.path.exists(file_path):
        print(f"Error: CSV file not found at {file_path}")
        return

    print(f"Reading tickets from: {file_path}")
    count = 0
    
    with open(file_path, 'r', encoding='utf-8') as f:
        # Assuming your CSV has 'ticket_text' and 'intent' or just a raw text column
        reader = csv.reader(f)
        header = next(reader) # skip header
        
        for row in reader:
            if not row: continue
            
            # The ticket text is usually the first column in your dataset
            ticket_text = row[0]
            
            success, _ = send_ticket_to_n8n(ticket_text, webhook_url)
            count += 1
            
            if max_tickets and count >= max_tickets:
                break
                
            if success:
                print(f"Waiting {delay} seconds before next ticket to avoid rate limits...")
                time.sleep(delay)

    print(f"\n🎉 Finished processing {count} tickets.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Action Path Pipeline - Send tickets to n8n workflow")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--ticket", type=str, help="Process a single ticket string")
    group.add_argument("--csv", type=str, help="Process a batch of tickets from a CSV file")
    
    parser.add_argument("--limit", type=int, default=5, help="Max number of tickets to process from CSV (default: 5)")
    parser.add_argument("--delay", type=float, default=2.0, help="Delay in seconds between CSV requests (default: 2.0)")
    parser.add_argument("--url", type=str, default=DEFAULT_WEBHOOK_URL, help="Custom n8n Webhook URL")
    parser.add_argument("--production", action="store_true", help="Use production /webhook/ instead of /webhook-test/")
    
    args = parser.parse_args()
    
    # Adjust URL if production flag is passed
    target_url = args.url
    if args.production and target_url == DEFAULT_WEBHOOK_URL:
        target_url = target_url.replace("/webhook-test/", "/webhook/")
        print(f"Mode: PRODUCTION (Using active workflow endpoint)")
    else:
        if "/webhook-test/" in target_url:
            print(f"Mode: TEST (Remember to click 'Execute Workflow' in n8n first!)")
    
    if args.ticket:
        send_ticket_to_n8n(args.ticket, target_url)
    elif args.csv:
        process_csv(args.csv, target_url, max_tickets=args.limit, delay=args.delay)
