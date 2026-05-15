import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllTickets, fetchAdminStats, resolveTicket as resolveTicketApi, deleteTicket as deleteTicketApi, updateTicket as updateTicketApi } from '@lib/api';
import { useTicketStore } from '@admin/store/ticketStore';

// Convert backend ticket format to frontend format
function convertTicket(ticket: any) {
  let agentName = ticket.assigned_agent_name;
  if (!agentName || agentName === 'Unassigned') {
    if (ticket.pipeline_path === 'Action') agentName = 'n8n Bot';
    else if (ticket.pipeline_path === 'FAQ') agentName = 'RAG Agent';
    else agentName = 'Unassigned';
  }

  return {
    id: ticket.id.toString(),
    ticketNumber: `#${ticket.id}`,
    subject: ticket.title,
    description: ticket.description,
    requester: {
      id: ticket.assigned_employee_id?.toString() || 'unknown',
      name: ticket.requester_name || 'Unknown User',
      department: ticket.category || 'IT',
    },
    agent: agentName !== 'Unassigned' ? {
      id: ticket.assigned_employee_id?.toString() || 'bot',
      name: agentName,
    } : null,
    status: mapBackendStatus(ticket.status),
    priority: mapPriority(ticket.severity),
    category: (ticket.category || 'Other') as any,
    lastMessage: ticket.description?.slice(0, 60) + '...' || '',
    resolutionNotes: ticket.resolution_notes || '',
    pipelinePath: ticket.pipeline_path || '',
    createdAt: ticket.created_at,
    updatedAt: ticket.created_at,
  };
}

function mapBackendStatus(status: string) {
  const statusMap: Record<string, any> = {
    'open': 'critical',
    'in_progress': 'in_progress',
    'resolved': 'resolved',
    'assigned': 'pending',
    'faq_resolved': 'faq_resolved',
    'action_path_resolved': 'action_path_resolved',
    'complex_path_resolved': 'complex_path_resolved',
  };
  return statusMap[status] || 'pending';
}

function mapPriority(severity: number | null) {
  if (!severity) return 'medium';
  if (severity >= 5) return 'urgent';
  if (severity >= 4) return 'high';
  if (severity >= 2) return 'medium';
  return 'low';
}

export function useStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const data = await fetchAdminStats();
      const totalTickets = data.total_tickets || 0;
      const resolved = data.resolved || 0;
      const resolutionRate = totalTickets > 0 ? Math.round((resolved / totalTickets) * 100) : 0;

      return {
        openTickets: (data.open_tickets || 0) + (data.in_progress || 0),
        avgResolution: '—',
        customerCsat: resolutionRate,
        systemHealth: 'Active' as const,
        totalTickets,
        resolved,
        inProgress: data.in_progress || 0,
        totalEmployees: data.total_employees || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllTickets() {
  const setTickets = useTicketStore((state) => state.setTickets);
  const setLoading = useTicketStore((state) => state.setLoading);

  return useQuery({
    queryKey: ['all-tickets'],
    queryFn: async () => {
      setLoading(true);
      const data = await fetchAllTickets();
      const converted = data.map(convertTicket);
      setTickets(converted);
      setLoading(false);
      return converted;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useResolveTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: number) => resolveTicketApi(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string | number) => deleteTicketApi(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string | number; data: any }) => updateTicketApi(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}
