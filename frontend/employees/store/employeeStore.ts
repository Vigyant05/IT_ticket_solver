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
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'assigned';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  subcategory?: string;
  severity?: number;
  urgency?: number;
  createdAt: string;
}

interface EmployeeStore {
  theme: 'dark' | 'light';
  activeTab: 'resolve' | 'history';
  messages: Message[];
  tickets: Ticket[];
  activeTickets: Ticket[];
  historyTickets: Ticket[];
  isLoading: boolean;
  employeeId: number | null;

  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setActiveTab: (tab: 'resolve' | 'history') => void;
  addMessage: (msg: Message) => void;
  setTickets: (tickets: Ticket[]) => void;
  setActiveTickets: (tickets: Ticket[]) => void;
  setHistoryTickets: (tickets: Ticket[]) => void;
  setLoading: (loading: boolean) => void;
  setEmployeeId: (id: number | null) => void;
}

export const useEmployeeStore = create<EmployeeStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeTab: 'resolve',
      messages: [],
      tickets: [],
      activeTickets: [],
      historyTickets: [],
      isLoading: false,
      employeeId: null,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),
      setTickets: (tickets) => set({ tickets }),
      setActiveTickets: (tickets) => set({ activeTickets: tickets }),
      setHistoryTickets: (tickets) => set({ historyTickets: tickets }),
      setLoading: (loading) => set({ isLoading: loading }),
      setEmployeeId: (id) => set({ employeeId: id }),
    }),
    {
      name: 'employee-portal-store',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

