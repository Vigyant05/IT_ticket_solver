'use client';

import { StatsRow } from '@admin/components/tickets/StatsRow';
import { TicketTable } from '@admin/components/tickets/TicketTable';
import { ProtectedRoute } from '@app/auth/ProtectedRoute';
import { useEffect } from 'react';
import { useAllTickets } from '@admin/hooks/useTickets';
import { Loader2 } from 'lucide-react';

function TicketsPageContent() {
  const { isLoading, error } = useAllTickets();

  return (
    <div className="max-w-[1200px] mx-auto pt-2">
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="text-red-500 text-sm p-4">{error}</div>
      )}
      <StatsRow />
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm mt-6">
        <div className="p-4">
          <TicketTable />
        </div>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <ProtectedRoute requiredRole="Admin">
      <TicketsPageContent />
    </ProtectedRoute>
  );
}
