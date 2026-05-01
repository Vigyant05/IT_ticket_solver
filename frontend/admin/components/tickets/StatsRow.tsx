'use client';

import { useStats } from '@admin/hooks/useTickets';
import { Activity, Clock, ThumbsUp, Cpu } from 'lucide-react';
import { cn } from '@admin/lib/utils';

export function StatsRow() {
  const { data: stats, isLoading } = useStats();

  const cards = [
    {
      label: 'OPEN TICKETS',
      value: stats?.openTickets ?? '—',
      icon: Activity,
      className: 'bg-card border-border',
      valueClass: 'text-3xl font-bold text-foreground',
    },
    {
      label: 'AVG. RESOLUTION',
      value: stats?.avgResolution ?? '—',
      icon: Clock,
      className: 'bg-card border-border',
      valueClass: 'text-3xl font-bold text-foreground',
    },
    {
      label: 'CUSTOMER CSAT',
      value: stats ? `${stats.customerCsat}%` : '—',
      icon: ThumbsUp,
      className: 'bg-card border-border',
      valueClass: 'text-3xl font-bold text-foreground',
    },
    {
      label: 'SYSTEM HEALTH',
      value: stats?.systemHealth ?? 'Active',
      icon: Cpu,
      className: 'bg-gradient-to-br from-[#1e3a5f] to-[#1a2c4e] border-blue-800/50 text-white',
      valueClass: 'text-2xl font-bold text-white flex items-center gap-2',
      isHealth: true,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, icon: Icon, className, valueClass, isHealth }) => (
        <div
          key={label}
          className={cn(
            'rounded-xl border p-4 flex flex-col justify-between min-h-[90px] transition-transform duration-200 hover:scale-[1.01]',
            className,
            isLoading && 'animate-pulse'
          )}
        >
          <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-2', isHealth ? 'text-blue-300/70' : 'text-muted-foreground')}>
            {label}
          </p>
          <div className={valueClass}>
            {value}
            {isHealth && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
