'use client';

import { useMemo, useState } from 'react';
import { useTicketStore } from '@admin/store/ticketStore';
import { TicketRow } from './TicketRow';
import { Ticket, FilterTab } from '@admin/lib/types';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@admin/lib/utils';

const PAGE_SIZE = 10;

function filterTickets(tickets: Ticket[], filter: FilterTab, query: string): Ticket[] {
  let result = tickets;

  if (filter !== 'all') {
    if (filter === 'resolved') {
      result = result.filter((t) =>
        ['resolved', 'faq_resolved', 'action_path_resolved', 'complex_path_resolved'].includes(t.status)
      );
    } else if (filter === 'unresolved') {
      result = result.filter((t) => ['critical', 'pending', 'in_progress'].includes(t.status));
    } else {
      result = result.filter((t) => t.status === filter);
    }
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.requester.name.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }

  return result;
}

export function TicketTable() {
  const { tickets, filter, searchQuery } = useTicketStore();
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => filterTickets(tickets, filter, searchQuery),
    [tickets, filter, searchQuery]
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20">
              {['REQUESTER', 'SUBJECT', 'AGENT', 'STATUS', 'LAST MESSAGE'].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Inbox size={36} className="opacity-30" />
                    <p className="text-sm">No tickets found</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((ticket, idx) => (
                <TicketRow key={ticket.id} ticket={ticket} index={idx} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4 px-1">
        <span className="text-xs text-muted-foreground">
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
          {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} tickets
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={cn(
              'p-1.5 rounded-md transition-all duration-200',
              page === 1
                ? 'text-muted-foreground/30 cursor-not-allowed'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                'w-7 h-7 rounded-md text-xs font-medium transition-all duration-200',
                p === page
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className={cn(
              'p-1.5 rounded-md transition-all duration-200',
              page === totalPages || totalPages === 0
                ? 'text-muted-foreground/30 cursor-not-allowed'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
