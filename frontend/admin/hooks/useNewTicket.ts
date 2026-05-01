import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTicketStore } from '@admin/store/ticketStore';
import { createTicket } from '@admin/lib/api';
import { CreateTicketInput } from '@admin/lib/types';

export function useNewTicket(onSuccess?: () => void) {
  const addTicket = useTicketStore((s) => s.addTicket);

  return useMutation({
    mutationFn: (input: CreateTicketInput) => createTicket(input),
    onMutate: () => {
      toast.loading('Creating ticket...', { id: 'create-ticket' });
    },
    onSuccess: (ticket) => {
      addTicket(ticket);
      toast.success(`Ticket ${ticket.ticketNumber} created successfully!`, {
        id: 'create-ticket',
      });
      onSuccess?.();
    },
    onError: () => {
      toast.error('Failed to create ticket. Please try again.', {
        id: 'create-ticket',
      });
    },
  });
}
