'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actions?: { label: string; variant?: 'primary' | 'secondary' }[];
}

export interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
}

interface UserStore {
  theme: 'dark' | 'light';
  activeTab: 'service-desk' | 'ticket-history';
  messages: Message[];
  tickets: Ticket[];
  isLoading: boolean;

  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setActiveTab: (tab: 'service-desk' | 'ticket-history') => void;
  addMessage: (msg: Message) => void;
  setTickets: (tickets: Ticket[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeTab: 'service-desk',
      messages: [],
      tickets: [],
      isLoading: false,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),
      setTickets: (tickets) => set({ tickets }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'user-portal-store',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
