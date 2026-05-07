'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Ticket } from '@admin/lib/types';
import { StatusBadge } from './StatusBadge';
import { formatTimeAgo, cn } from '@admin/lib/utils';
import { useTicketStore } from '@admin/store/ticketStore';
import { toast } from 'sonner';
import { ChevronDown, Trash2, Loader2 } from 'lucide-react';
import { useDeleteTicket } from '@admin/hooks/useTickets';

const STATUS_OPTIONS: { label: string; value: Ticket['status'] }[] = [
  { label: 'Critical', value: 'critical' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'FAQ Resolved', value: 'faq_resolved' },
  { label: 'Action Path', value: 'action_path_resolved' },
  { label: 'Complex Path', value: 'complex_path_resolved' },
];

function AvatarInitials({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
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

interface TicketRowProps {
  ticket: Ticket;
  index: number;
}

export function TicketRow({ ticket, index }: TicketRowProps) {
  const updateTicketStatus = useTicketStore((s) => s.updateTicketStatus);
  const removeNewFlag = useTicketStore((s) => s.removeNewFlag);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleStatusChange = useCallback(
    (newStatus: Ticket['status']) => {
      const previousStatus = ticket.status;
      // Optimistic update
      updateTicketStatus(ticket.id, newStatus);
      setShowStatusMenu(false);
      toast.success(`Ticket ${ticket.ticketNumber} status updated`, {
        description: `→ ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label}`,
        action: {
          label: 'Undo',
          onClick: () => {
            updateTicketStatus(ticket.id, previousStatus);
            toast.info('Status change reverted');
          },
        },
      });
    },
    [ticket.id, ticket.ticketNumber, ticket.status, updateTicketStatus]
  );

  return (
    <>
    <tr
      onClick={(e) => {
        // Prevent expanding if clicking the status dropdown
        if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
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
        <p className="text-sm font-medium text-blue-400 hover:text-blue-300 cursor-pointer leading-snug transition-colors flex items-center gap-2">
          TKT-{ticket.id.padStart(4, '0')}
          {ticket.pipelinePath && (
            <span className="bg-blue-500/10 text-blue-400 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">
              {ticket.pipelinePath}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={ticket.subject}>
          {ticket.subject}
        </p>
      </td>

      {/* Agent */}
      <td className="px-4 py-4">
        {ticket.agent ? (
          <div className="flex items-center gap-2">
            <StatusBadge status={ticket.status} showDot />
            <span className="text-sm text-foreground">{ticket.agent.name}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground/70 italic">Unassigned</span>
        )}
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
      <td className="px-4 py-4 whitespace-nowrap">
        <p className="text-sm text-muted-foreground">{formatTimeAgo(ticket.updatedAt)}</p>
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
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
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
