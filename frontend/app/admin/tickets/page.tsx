import { Metadata } from 'next';
import { StatsRow } from '@admin/components/tickets/StatsRow';
import { TicketTable } from '@admin/components/tickets/TicketTable';

export const metadata: Metadata = {
  title: 'Tickets | IT Resolver',
  description: 'Manage and resolve IT support tickets',
};

export default function TicketsPage() {
  return (
    <div className="max-w-[1200px] mx-auto pt-2">
      <StatsRow />
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm mt-6">
        <div className="p-4">
          <TicketTable />
        </div>
      </div>
    </div>
  );
}
