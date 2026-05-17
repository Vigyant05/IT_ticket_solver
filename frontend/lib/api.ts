const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('auth_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

// ============== Admin API ==============

export async function fetchAdminStats() {
  const response = await fetch(`${API_BASE}/api/admin/stats`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch admin stats');
  return response.json();
}

export async function fetchAIMetrics(hloDays: number = 30) {
  const response = await fetch(`${API_BASE}/api/metrics?hlo_days=${hloDays}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch AI metrics');
  return response.json();
}

export async function fetchEmployees() {
  const response = await fetch(`${API_BASE}/api/admin/employees`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch employees');
  return response.json();
}

export async function fetchAllTickets() {
  const response = await fetch(`${API_BASE}/api/admin/tickets`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch tickets');
  return response.json();
}

export async function fetchAllEmployees() {
  const response = await fetch(`${API_BASE}/api/admin/employees`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch employees');
  return response.json();
}

export async function resolveTicket(ticketId: number) {
  const response = await fetch(`${API_BASE}/api/ticket/${ticketId}/resolve`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to resolve ticket');
  return response.json();
}

export async function updateTicket(ticketId: number, data: {
  status?: string;
  category?: string;
  subcategory?: string;
  severity?: number;
  urgency?: number;
}) {
  const response = await fetch(`${API_BASE}/api/ticket/${ticketId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update ticket');
  return response.json();
}

export async function deleteTicket(ticketId: string | number) {
  const response = await fetch(`${API_BASE}/api/ticket/${ticketId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete ticket');
  return response.json();
}

export async function reassignTicket(ticketId: string | number, employeeId: number) {
  const response = await fetch(`${API_BASE}/api/ticket/${ticketId}/reassign`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ employee_id: employeeId }),
  });
  if (!response.ok) throw new Error('Failed to reassign ticket');
  return response.json();
}

export async function fetchMessages(params: { ticket_id?: number | string; user1?: string; user2?: string }) {
  const query = new URLSearchParams(params as any).toString();
  const response = await fetch(`${API_BASE}/api/messages?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

export async function sendMessage(data: { ticket_id?: number | string; sender_id: string; receiver_id?: string; sender_name: string; content: string }) {
  const response = await fetch(`${API_BASE}/api/messages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
}

export async function createTicket(data: {
  title: string;
  description: string;
  category?: string;
  subcategory?: string;
}) {
  const response = await fetch(`${API_BASE}/api/tickets`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create ticket');
  return response.json();
}

// Submits ticket through the full AI pipeline (classify → Action / FAQ / Complex)
export async function submitTicketToPipeline(data: {
  ticket_id: string;
  ticket_text: string;
  requester_name?: string;
  requester_id?: number;
}) {
  const response = await fetch(`${API_BASE}/submit_ticket`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to submit ticket to pipeline');
  return response.json();
}


// ============== Employee API ==============

export async function fetchEmployeeTickets(employeeId: number, status?: string) {
  const url = status
    ? `${API_BASE}/api/employee/${employeeId}/tickets?status=${status}`
    : `${API_BASE}/api/employee/${employeeId}/tickets`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch employee tickets');
  return response.json();
}

export async function fetchEmployee(employeeId: number) {
  const response = await fetch(`${API_BASE}/api/employee/${employeeId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch employee');
  return response.json();
}

// ============== User API ==============

export async function fetchUserTickets(userId: number) {
  const response = await fetch(`${API_BASE}/api/user/${userId}/tickets`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch user tickets');
  return response.json();
}

export async function fetchTicket(ticketId: number | string) {
  const response = await fetch(`${API_BASE}/api/ticket/${ticketId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch ticket');
  return response.json();
}

// ============== Chatbot API ==============

export async function chatWithBot(message: string) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(message),
  });
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
}
