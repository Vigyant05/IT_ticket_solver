'use client';

import { useEffect, useState } from 'react';
import { cn } from '@employees/lib/utils';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ProtectedRoute } from '@app/auth/ProtectedRoute';
import { useAuth } from '@app/auth/AuthContext';
import { fetchEmployeeTickets } from '@lib/api';

interface TicketData {
  id: number;
  title: string;
  description: string;
  category: string | null;
  subcategory: string | null;
  severity: number | null;
  urgency: number | null;
  priority_score: number | null;
  status: string;
  created_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  open: {
    label: 'Open',
    icon: AlertCircle,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-500/15',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-500/15',
  },
  assigned: {
    label: 'Assigned',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-500/15',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-500/15',
  },
  closed: {
    label: 'Closed',
    icon: XCircle,
    color: 'text-[#5f5f62] dark:text-[#a0a5b5]',
    bg: 'bg-[#f0eff0] dark:bg-white/5',
  },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-[#5f5f62] dark:text-[#a0a5b5]' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400' },
  high: { label: 'High', color: 'text-orange-600 dark:text-orange-400' },
  critical: { label: 'Critical', color: 'text-red-600 dark:text-red-400' },
};

function mapPriority(severity: number | null): string {
  if (!severity) return 'medium';
  if (severity >= 5) return 'critical';
  if (severity >= 4) return 'high';
  if (severity >= 2) return 'medium';
  return 'low';
}

function HistoryContent() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTickets() {
      if (!user?.id) return;
      try {
        const data = await fetchEmployeeTickets(user.id);
        setTickets(data);
      } catch (error) {
        console.error('Failed to load tickets', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTickets();
  }, [user?.id]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8f7f9] dark:bg-[#12131a]">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
        {/* Title */}
        <div className="mb-5">
          <h1 className="text-[32px] font-manrope font-bold text-[#1e2a35] dark:text-[#e8edf5] leading-tight tracking-tight">
            Ticket History
          </h1>
          <p className="text-[13px] text-[#5f5f62] dark:text-[#a0a5b5] mt-1">
            All tickets assigned to {user?.name}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#3b637b]" />
          </div>
        ) : (
          <>
            {/* Ticket table */}
            <div className="bg-white dark:bg-[#1a1b24] rounded-xl shadow-[0px_4px_24px_rgba(13,60,82,0.05)] dark:shadow-none dark:border dark:border-white/5 overflow-hidden">
              {/* Table head */}
              <div className="grid grid-cols-[80px_1fr_100px_100px_80px_80px] gap-4 px-5 py-3 border-b border-[#f0eff0] dark:border-white/5 text-[10px] font-bold tracking-widest uppercase text-[#a0a5b5]">
                <span>ID</span>
                <span>Subject</span>
                <span>Category</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Created</span>
              </div>
              {tickets.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-[#a0a5b5]">No tickets found.</div>
              ) : (
                tickets.map((ticket, idx) => {
                  const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG['assigned'];
                  const priority = mapPriority(ticket.severity);
                  const pc = PRIORITY_MAP[priority];
                  const StatusIcon = sc.icon;
                  const created = ticket.created_at ? new Date(ticket.created_at) : new Date();
                  const createdLabel = created.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <div
                      key={ticket.id}
                      className={cn(
                        'grid grid-cols-[80px_1fr_100px_100px_80px_80px] gap-4 px-5 py-4 items-center hover:bg-[#f8f7f9] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group',
                        idx !== tickets.length - 1 && 'border-b border-[#f0eff0] dark:border-white/5'
                      )}
                    >
                      <span className="text-[12px] font-mono font-bold text-[#3b637b] dark:text-[#5a8cae]">
                        #{ticket.id}
                      </span>
                      <span className="text-[13px] text-[#323235] dark:text-[#e2e4f0] line-clamp-1 font-medium">
                        {ticket.title}
                      </span>
                      <span className="text-[12px] text-[#5f5f62] dark:text-[#a0a5b5] truncate">
                        {ticket.category || '—'}
                      </span>
                      <div>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold',
                            sc.bg,
                            sc.color
                          )}
                        >
                          <StatusIcon size={10} />
                          {sc.label}
                        </span>
                      </div>
                      <span className={cn('text-[12px] font-semibold', pc.color)}>
                        {pc.label}
                      </span>
                      <span className="text-[11px] text-[#a0a5b5]">{createdLabel}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
              {[
                { label: 'Total Tickets', value: tickets.length, color: 'text-[#3b637b] dark:text-[#5a8cae]' },
                { label: 'Open/Assigned', value: tickets.filter(t => t.status === 'open' || t.status === 'assigned').length, color: 'text-amber-600 dark:text-amber-400' },
                { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length, color: 'text-blue-600 dark:text-blue-400' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-[#1a1b24] rounded-xl p-4 shadow-[0px_4px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 text-center">
                  <div className={cn('text-2xl font-bold font-manrope', stat.color)}>{stat.value}</div>
                  <div className="text-[11px] text-[#a0a5b5] font-semibold mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute requiredRole="Employee">
      <HistoryContent />
    </ProtectedRoute>
  );
}
