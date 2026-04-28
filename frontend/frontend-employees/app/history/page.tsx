'use client';

import { useEmployeeStore } from '@/store/employeeStore';
import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

const STATUS_CONFIG = {
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

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-[#5f5f62] dark:text-[#a0a5b5]' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400' },
  high: { label: 'High', color: 'text-orange-600 dark:text-orange-400' },
  critical: { label: 'Critical', color: 'text-red-600 dark:text-red-400' },
};

export default function HistoryPage() {
  const { tickets } = useEmployeeStore();

  const filtered = tickets;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8f7f9] dark:bg-[#12131a]">

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
        {/* Title */}
        <div className="mb-5">
          <h1 className="text-[32px] font-manrope font-bold text-[#1e2a35] dark:text-[#e8edf5] leading-tight tracking-tight">
            Resolved History
          </h1>
        </div>

        {/* Ticket table */}
        <div className="bg-white dark:bg-[#1a1b24] rounded-xl shadow-[0px_4px_24px_rgba(13,60,82,0.05)] dark:shadow-none dark:border dark:border-white/5 overflow-hidden">
          {/* Table head */}
          <div className="grid grid-cols-[100px_1fr_120px_100px_80px_80px_40px] gap-4 px-5 py-3 border-b border-[#f0eff0] dark:border-white/5 text-[10px] font-bold tracking-widest uppercase text-[#a0a5b5]">
            <span>Ticket ID</span>
            <span>Subject</span>
            <span>User</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Updated</span>
            <span />
          </div>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[#a0a5b5]">No tickets found.</div>
          ) : (
            filtered.map((ticket, idx) => {
              const sc = STATUS_CONFIG[ticket.status];
              const pc = PRIORITY_CONFIG[ticket.priority];
              const StatusIcon = sc.icon;
              const updated = new Date(ticket.updatedAt);
              const updatedLabel = updated.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              return (
                <div
                  key={ticket.id}
                  className={cn(
                    'grid grid-cols-[100px_1fr_120px_100px_80px_80px_40px] gap-4 px-5 py-4 items-center hover:bg-[#f8f7f9] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group',
                    idx !== filtered.length - 1 && 'border-b border-[#f0eff0] dark:border-white/5'
                  )}
                >
                  <span className="text-[12px] font-mono font-bold text-[#3b637b] dark:text-[#5a8cae]">
                    {ticket.id}
                  </span>
                  <span className="text-[13px] text-[#323235] dark:text-[#e2e4f0] line-clamp-1 font-medium">
                    {ticket.subject}
                  </span>
                  <span className="text-[12px] text-[#5f5f62] dark:text-[#a0a5b5] truncate">
                    {ticket.user}
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
                  <span className="text-[11px] text-[#a0a5b5]">{updatedLabel}</span>
                  <button className="w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-[#f0f4f6] dark:hover:bg-white/5 transition-all">
                    <ChevronRight size={14} className="text-[#a0a5b5]" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Total Tickets', value: tickets.length, color: 'text-[#3b637b] dark:text-[#5a8cae]' },
            { label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length, color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Closed', value: tickets.filter(t => t.status === 'closed').length, color: 'text-[#a0a5b5]' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-[#1a1b24] rounded-xl p-4 shadow-[0px_4px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 text-center">
              <div className={cn('text-2xl font-bold font-manrope', stat.color)}>{stat.value}</div>
              <div className="text-[11px] text-[#a0a5b5] font-semibold mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
