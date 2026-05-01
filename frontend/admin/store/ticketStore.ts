import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Ticket, FilterTab } from '@admin/lib/types';
import { MOCK_TICKETS } from '@admin/lib/mockData';

interface TicketStore {
  tickets: Ticket[];
  filter: FilterTab;
  theme: 'dark' | 'light';
  searchQuery: string;

  setFilter: (filter: FilterTab) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setSearchQuery: (query: string) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => void;
  removeNewFlag: (ticketId: string) => void;
}

export const useTicketStore = create<TicketStore>()(
  persist(
    (set) => ({
      tickets: MOCK_TICKETS,
      filter: 'all',
      theme: 'dark',
      searchQuery: '',

      setFilter: (filter) => set({ filter }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

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
