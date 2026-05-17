import { Ticket, CreateTicketInput } from '@admin/lib/types';
import { generateTicketId } from '@admin/lib/utils';
import { fetchAdminStats, fetchAllTickets as fetchAllTicketsApi, fetchAllEmployees as fetchAllEmployeesApi, createTicket as createTicketApi, resolveTicket as resolveTicketApi, updateTicket as updateTicketApi } from '@lib/api';

export async function fetchStats() {
  const data = await fetchAdminStats();
  return {
    openTickets: data.open_tickets + (data.in_progress || 0),
    avgResolution: '—',
    customerCsat: data.total_tickets > 0 ? Math.round((data.resolved / data.total_tickets) * 100) : 0,
    systemHealth: 'Active' as const,
    totalTickets: data.total_tickets,
    resolved: data.resolved,
    inProgress: data.in_progress,
    totalEmployees: data.total_employees,
  };
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const result = await createTicketApi({
    title: input.subject,
    description: input.description,
  });

  const now = new Date().toISOString();
  const ticket: Ticket = {
    id: result.ticket_id?.toString() || crypto.randomUUID(),
    ticketNumber: `#${result.ticket_id || generateTicketId()}`,
    subject: input.subject,
    description: input.description,
    requester: {
      id: crypto.randomUUID(),
      name: input.requesterName,
      department: input.requesterDepartment,
    },
    agent: null,
    status: 'pending',
    priority: input.priority,
    category: input.category,
    lastMessage: input.description.slice(0, 60) + '...',
    createdAt: now,
    updatedAt: now,
    isNew: true,
  };
  return ticket;
}

export async function updateTicketStatus(
  ticketId: string,
  status: Ticket['status']
): Promise<Ticket> {
  if (status === 'resolved') {
    await resolveTicketApi(parseInt(ticketId));
  } else {
    await updateTicketApi(parseInt(ticketId), { status });
  }
  return { id: ticketId, status } as Ticket;
}
