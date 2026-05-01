'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Ticket } from '@admin/lib/types';
import { StatusBadge } from './StatusBadge';
import { formatTimeAgo, cn } from '@admin/lib/utils';
import { useTicketStore } from '@admin/store/ticketStore';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';

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
  const [isSliding, setIsSliding] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <tr
      className={cn(
        'group border-b border-border/30 hover:bg-muted/30 transition-all duration-200',
        ticket.isNew || isSliding
          ? 'animate-slideInRight'
          : 'opacity-100'
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
        <p className="text-sm font-medium text-blue-400 hover:text-blue-300 cursor-pointer leading-snug line-clamp-2 transition-colors">
          {ticket.subject}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ticket {ticket.ticketNumber} •{' '}
          <span className="text-muted-foreground/70">{ticket.category}</span>
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
  );
}
