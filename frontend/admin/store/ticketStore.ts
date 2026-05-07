import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Ticket, FilterTab } from '@admin/lib/types';

interface TicketStore {
  tickets: Ticket[];
  filter: FilterTab;
  theme: 'dark' | 'light';
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  setFilter: (filter: FilterTab) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setSearchQuery: (query: string) => void;
  setTickets: (tickets: Ticket[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => void;
  removeNewFlag: (ticketId: string) => void;
}

export const useTicketStore = create<TicketStore>()(
  persist(
    (set) => ({
      tickets: [],
      filter: 'all',
      theme: 'dark',
      searchQuery: '',
      isLoading: false,
      error: null,

      setFilter: (filter) => set({ filter }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setTickets: (tickets) => set({ tickets }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      addTicket: (ticket) =>
        set((state) => ({
          tickets: [{ ...ticket, isNew: true }, ...state.tickets],
        })),

      updateTicketStatus: (ticketId, status) =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, status } : t
          ),
        })),

      removeNewFlag: (ticketId) =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, isNew: false } : t
          ),
        })),
    }),
    {
      name: 'it-ticket-store',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
