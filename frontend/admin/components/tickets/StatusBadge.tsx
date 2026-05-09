'use client';

import { cn } from '@admin/lib/utils';
import { TicketStatus } from '@admin/lib/types';

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  critical: {
    label: 'CRITICAL',
    className: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
  pending: {
    label: 'PENDING',
    className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  },
  in_progress: {
    label: 'IN PROGRESS',
    className: 'bg-primary/50/20 text-primary border border-primary/30',
  },
  resolved: {
    label: 'RESOLVED',
    className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  },
  faq_resolved: {
    label: 'FAQ RESOLVED',
    className: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  },
  action_path_resolved: {
    label: 'ACTION PATH',
    className: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  },
  complex_path_resolved: {
    label: 'COMPLEX PATH',
    className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  },
};

const DOT_COLORS: Record<TicketStatus, string> = {
  critical: 'bg-red-500',
  pending: 'bg-amber-400',
  in_progress: 'bg-primary',
  resolved: 'bg-emerald-400',
  faq_resolved: 'bg-purple-400',
  action_path_resolved: 'bg-cyan-400',
  complex_path_resolved: 'bg-orange-400',
};

interface StatusBadgeProps {
  status: TicketStatus;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, showDot = false, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  if (showDot) {
    return (
      <span className={cn('w-2 h-2 rounded-full inline-block', DOT_COLORS[status], className)} />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
