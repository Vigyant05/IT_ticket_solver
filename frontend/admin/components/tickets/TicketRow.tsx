'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Ticket } from '@admin/lib/types';
import { StatusBadge } from './StatusBadge';
import { formatTimeAgo, cn } from '@admin/lib/utils';
import { useTicketStore } from '@admin/store/ticketStore';
import { toast } from 'sonner';
import { ChevronDown, Trash2, Loader2, Search, UserCheck, X } from 'lucide-react';
import { useDeleteTicket, useUpdateTicket, useReassignTicket, useEmployeeList } from '@admin/hooks/useTickets';

const STATUS_OPTIONS: { label: string; value: Ticket['status'] }[] = [
  { label: 'Critical', value: 'critical' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'FAQ Resolved', value: 'faq_resolved' },
  { label: 'Action Path', value: 'action_path_resolved' },
  { label: 'Complex Path', value: 'complex_path_resolved' },
];

const TEAM_LABEL: Record<string, string> = {
  'L1 Support': 'L1',
  'L2 Support': 'L2',
  'L3 Support': 'L3',
  'Security': 'SEC',
  'Network': 'NET',
  'DevOps': 'OPS',
};

function AvatarInitials({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const colors = [
    'from-violet-500 to-purple-600',
    'from-primary to-primary/70',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-rose-500 to-pink-600',
  ];
  const colorIdx = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold shrink-0',
        colors[colorIdx],
        size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'
      )}
    >
      {initials}
    </div>
  );
}

// ── Reassign dropdown ─────────────────────────────────────────────────────────
interface ReassignDropdownProps {
  ticketId: string;
  currentAgentName?: string;
  onClose: () => void;
}

function ReassignDropdown({ ticketId, currentAgentName, onClose }: ReassignDropdownProps) {
  const [search, setSearch] = useState('');
  const { data: employees = [], isLoading } = useEmployeeList();
  const { mutate: reassign, isPending } = useReassignTicket();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filtered = (employees as any[]).filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      (e.team || '').toLowerCase().includes(q) ||
      (e.role || '').toLowerCase().includes(q) ||
      (e.expertise_tags || []).some((t: string) => t.toLowerCase().includes(q))
    );
  });

  const handleReassign = (emp: any) => {
    reassign(
      { ticketId, employeeId: emp.id },
      {
        onSuccess: () => {
          toast.success(`Ticket reassigned to ${emp.name}`);
          onClose();
        },
        onError: () => toast.error('Failed to reassign ticket'),
      }
    );
  };

  const availabilityColor = (a: boolean) => (a ? 'bg-emerald-400' : 'bg-amber-400');

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-[100] bg-popover border border-border rounded-xl shadow-2xl w-72 overflow-hidden animate-in fade-in-0 zoom-in-95"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <UserCheck size={13} />
          Reassign Ticket
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-2.5 py-1.5">
          <Search size={12} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, team, or skill…"
            className="w-full text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Employee list */}
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">No employees found</p>
        ) : (
          filtered.map((emp: any) => {
            const isCurrent = emp.name === currentAgentName;
            const teamTag = TEAM_LABEL[emp.team] || emp.team || 'IT';
            return (
              <button
                key={emp.id}
                disabled={isPending || isCurrent}
                onClick={() => handleReassign(emp)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                  isCurrent
                    ? 'bg-primary/10 cursor-default'
                    : 'hover:bg-muted/50 cursor-pointer'
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  'w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold shrink-0',
                  emp.name.charCodeAt(0) % 2 === 0 ? 'from-primary to-primary/70' : 'from-violet-500 to-purple-600'
                )}>
                  {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>

                {/* Name + designation */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate">{emp.name}</span>
                    {isCurrent && (
                      <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">current</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {teamTag}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">{emp.role}</span>
                  </div>
                </div>

                {/* Availability + load */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1">
                    <div className={cn('w-1.5 h-1.5 rounded-full', availabilityColor(emp.availability_status))} />
                    <span className="text-[9px] text-muted-foreground">{emp.availability_status ? 'Available' : 'Busy'}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">Load: {emp.current_load}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── TicketRow ─────────────────────────────────────────────────────────────────
interface TicketRowProps {
  ticket: Ticket;
  index: number;
}

export function TicketRow({ ticket, index }: TicketRowProps) {
  const updateTicketStatus = useTicketStore((s) => s.updateTicketStatus);
  const removeNewFlag = useTicketStore((s) => s.removeNewFlag);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showReassignMenu, setShowReassignMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<HTMLDivElement>(null);
  const { mutate: deleteTicket, isPending: isDeleting } = useDeleteTicket();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this ticket?')) {
      deleteTicket(ticket.id, {
        onSuccess: () => {
          toast.success(`Ticket ${ticket.ticketNumber} deleted successfully`);
        },
        onError: () => {
          toast.error('Failed to delete ticket');
        }
      });
    }
  };

  // Slide-in animation for new tickets
  useEffect(() => {
    if (ticket.isNew) {
      setIsSliding(true);
      const timer = setTimeout(() => {
        removeNewFlag(ticket.id);
        setIsSliding(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [ticket.isNew, ticket.id, removeNewFlag]);

  // Close status menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { mutate: updateTicketDb } = useUpdateTicket();

  const handleStatusChange = useCallback(
    (newStatus: Ticket['status']) => {
      const previousStatus = ticket.status;
      updateTicketStatus(ticket.id, newStatus);
      setShowStatusMenu(false);

      updateTicketDb({ ticketId: ticket.id, data: { status: newStatus } }, {
        onSuccess: () => {
          toast.success(`Ticket ${ticket.ticketNumber} status updated`, {
            description: `→ ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label}`,
          });
        },
        onError: () => {
          updateTicketStatus(ticket.id, previousStatus);
          toast.error('Failed to update ticket status');
        }
      });
    },
    [ticket.id, ticket.ticketNumber, ticket.status, updateTicketStatus, updateTicketDb]
  );

  return (
    <>
    <tr
      onClick={(e) => {
        if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
        if (agentRef.current && agentRef.current.contains(e.target as Node)) return;
        setIsExpanded(!isExpanded);
      }}
      className={cn(
        'group border-b border-border/30 hover:bg-muted/30 transition-all duration-200 cursor-pointer',
        ticket.isNew || isSliding
          ? 'animate-slideInRight'
          : 'opacity-100',
        isExpanded && 'bg-muted/30'
      )}
      style={{
        animationDelay: ticket.isNew ? '0ms' : `${index * 40}ms`,
      }}
    >
      {/* Requester */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <AvatarInitials name={ticket.requester.name} />
          <div>
            <p className="text-sm font-medium text-foreground leading-tight">
              {ticket.requester.name}
            </p>
            <p className="text-xs text-muted-foreground">{ticket.requester.department}</p>
          </div>
        </div>
      </td>

      {/* Subject */}
      <td className="px-4 py-4 max-w-[240px]">
        <p className="text-sm font-medium text-primary hover:text-primary/70 cursor-pointer leading-snug transition-colors flex items-center gap-2">
          TKT-{ticket.id.padStart(4, '0')}
          {ticket.pipelinePath && (
            <span className="bg-primary/50/10 text-primary text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">
              {ticket.pipelinePath}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={ticket.subject}>
          {ticket.subject}
        </p>
      </td>

      {/* Agent — clickable to reassign */}
      <td className="px-4 py-4">
        <div ref={agentRef} className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReassignMenu((v) => !v);
              setShowStatusMenu(false);
            }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-2 py-1.5 -mx-2 -my-1.5 transition-colors group/agent',
              showReassignMenu ? 'bg-muted/60' : 'hover:bg-muted/40'
            )}
            title="Click to reassign"
          >
            {ticket.agent ? (
              <>
                <StatusBadge status={ticket.status} showDot />
                <span className="text-sm text-foreground">{ticket.agent.name}</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground/70 italic">Unassigned</span>
            )}
            <ChevronDown
              size={11}
              className={cn(
                'text-muted-foreground transition-transform ml-auto opacity-0 group-hover/agent:opacity-100',
                showReassignMenu && 'rotate-180 opacity-100'
              )}
            />
          </button>

          {showReassignMenu && (
            <ReassignDropdown
              ticketId={ticket.id}
              currentAgentName={ticket.agent?.name}
              onClose={() => setShowReassignMenu(false)}
            />
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowStatusMenu((v) => !v)}
            className="flex items-center gap-1 group/status"
          >
            <StatusBadge status={ticket.status} />
            <ChevronDown
              size={12}
              className="text-muted-foreground opacity-0 group-hover/status:opacity-100 transition-opacity"
            />
          </button>

          {showStatusMenu && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl py-1 min-w-[160px] animate-in fade-in-0 zoom-in-95">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs font-medium hover:bg-muted/60 transition-colors',
                    ticket.status === opt.value && 'bg-muted/40'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>

      {/* Last Message */}
      <td className="px-4 py-4 max-w-[200px]">
        <p className="text-sm text-foreground truncate" title={ticket.status.includes('resolved') ? ticket.resolutionNotes : ticket.lastMessage}>
          {ticket.status.includes('resolved') ? ticket.resolutionNotes || ticket.lastMessage : ticket.lastMessage}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(ticket.updatedAt)}</p>
      </td>
    </tr>
    {isExpanded && (
      <tr className="bg-muted/10 border-b border-border/30">
        <td colSpan={5} className="p-0">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm animate-in slide-in-from-top-2">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Original Ticket Details</h4>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {ticket.description || 'No description provided.'}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  Resolution & Output
                  {ticket.pipelinePath && (
                    <span className="bg-primary/50/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                      {ticket.pipelinePath} Path
                    </span>
                  )}
                </h4>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Delete Ticket
                </button>
              </div>
              <div className="bg-background/50 border border-border/50 rounded-lg p-3 text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
                {ticket.resolutionNotes || 'No resolution notes yet.'}
              </div>
            </div>
          </div>
        </td>
      </tr>
    )}
    </>
  );
}
