'use client';

import { useTicketStore } from '@admin/store/ticketStore';
import { Search } from 'lucide-react';
import { FilterTab } from '@admin/lib/types';
import { cn } from '@admin/lib/utils';
import { NewTicketDialog } from '@admin/components/tickets/NewTicketDialog';

const FILTER_SECTIONS = [
  {
    title: 'ALL TICKETS',
    items: [
      { label: 'All tickets', value: 'all' as FilterTab },
      { label: 'Resolved Tickets', value: 'resolved' as FilterTab },
      { label: 'Unresolved Tickets', value: 'unresolved' as FilterTab },
    ]
  },
  {
    title: 'RESOLUTION PATHS',
    items: [
      { label: 'FAQ Resolved', value: 'faq_resolved' as FilterTab },
      { label: 'Action Path Resolved', value: 'action_path_resolved' as FilterTab },
      { label: 'Complex Path Resolved', value: 'complex_path_resolved' as FilterTab },
    ]
  }
];

export function SecondarySidebar() {
  const { filter, setFilter, searchQuery, setSearchQuery, tickets } = useTicketStore();

  // Helper to count tickets per filter tab
  const getTicketCount = (tab: FilterTab) => {
    if (tab === 'all') return tickets.length;
    if (tab === 'resolved') {
      return tickets.filter(t => ['resolved', 'faq_resolved', 'action_path_resolved', 'complex_path_resolved'].includes(t.status)).length;
    }
    if (tab === 'unresolved') {
      return tickets.filter(t => ['critical', 'pending', 'in_progress'].includes(t.status)).length;
    }
    return tickets.filter(t => t.status === tab).length;
  };

  return (
    <aside className="w-72 bg-card border-r border-border/50 flex flex-col h-screen shrink-0">
      {/* Header section */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between z-10">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Tickets
        </h1>
        <NewTicketDialog />
      </div>

      {/* Search Bar */}
      <div className="px-5 py-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search in all tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg 
                       placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 
                       focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
          />
        </div>
      </div>

      {/* Vertical Filters */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-4 space-y-6">
        {FILTER_SECTIONS.map((section, idx) => (
          <div key={idx}>
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const count = getTicketCount(item.value);
                const isActive = filter === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                      isActive
                        ? "bg-primary/5 dark:bg-primary/50/10 text-primary dark:text-primary"
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full transition-colors",
                      isActive
                        ? "bg-primary/10 dark:bg-primary/50/20 text-primary dark:text-primary/70"
                        : "bg-muted text-muted-foreground group-hover:bg-border/60"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
