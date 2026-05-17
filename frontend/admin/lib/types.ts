export type TicketStatus = 'critical' | 'pending' | 'in_progress' | 'resolved' | 'faq_resolved' | 'action_path_resolved' | 'complex_path_resolved';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketCategory = 'Network' | 'Software' | 'Hardware' | 'Licensing' | 'Security' | 'Access' | 'Other';

export interface Requester {
  id: string;
  name: string;
  department: string;
  avatar?: string;
}

export interface Agent {
  id: string;
  name: string;
  avatar?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  requester: Requester;
  agent: Agent | null;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
  isNew?: boolean;
  resolutionNotes?: string;
  pipelinePath?: string;
}

export interface StatsData {
  openTickets: number;
  avgResolution: string;
  customerCsat: number;
  systemHealth: 'Active' | 'Degraded' | 'Down';
}

export type FilterTab = 'all' | 'resolved' | 'unresolved' | 'faq_resolved' | 'action_path_resolved' | 'complex_path_resolved';

export interface CreateTicketInput {
  subject: string;
  description: string;
  requesterName: string;
  requesterDepartment: string;
  priority: TicketPriority;
  category: TicketCategory;
}
