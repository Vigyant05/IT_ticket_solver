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
  user: string;
}

interface EmployeeStore {
  theme: 'dark' | 'light';
  activeTab: 'resolve' | 'history';
  messages: Message[];
  tickets: Ticket[];

  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setActiveTab: (tab: 'resolve' | 'history') => void;
  addMessage: (msg: Message) => void;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    role: 'user',
    content:
      "Hello, I'm having trouble synchronizing my local vault with the main ledger. I keep getting \"Error 404: Node Unavailable\".",
    timestamp: '10:35 AM',
  },
  {
    id: 'm2',
    role: 'assistant',
    content:
      'Hello John! "Error 404: Node Unavailable" usually indicates a network gateway timeout. Let me check your current connection status on our end.',
    timestamp: '10:37 AM',
  },
  {
    id: 'm3',
    role: 'user',
    content: "I've tried running diagnostics locally and it says everything is fine on my end.",
    timestamp: '10:38 AM',
  },
];

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TKT-4821',
    subject: 'Node Unavailable Error 404',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2026-04-25T10:24:00Z',
    updatedAt: '2026-04-26T09:00:00Z',
    user: 'John Doe',
  },
  {
    id: 'TKT-4790',
    subject: 'Access Request: Ledger Admin Panel',
    status: 'resolved',
    priority: 'medium',
    createdAt: '2026-04-20T08:00:00Z',
    updatedAt: '2026-04-22T14:30:00Z',
    user: 'Alice Smith',
  },
  {
    id: 'TKT-4755',
    subject: 'Vault sync failure on subnet B',
    status: 'closed',
    priority: 'low',
    createdAt: '2026-04-10T11:00:00Z',
    updatedAt: '2026-04-12T16:00:00Z',
    user: 'Bob Johnson',
  },
  {
    id: 'TKT-4710',
    subject: 'Hardware wallet pairing issue',
    status: 'resolved',
    priority: 'medium',
    createdAt: '2026-04-05T09:00:00Z',
    updatedAt: '2026-04-07T10:00:00Z',
    user: 'Eve Davis',
  },
  {
    id: 'TKT-4680',
    subject: 'Ledger key reset request',
    status: 'closed',
    priority: 'low',
    createdAt: '2026-03-28T12:00:00Z',
    updatedAt: '2026-03-29T15:00:00Z',
    user: 'Michael Brown',
  },
];

export const useEmployeeStore = create<EmployeeStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeTab: 'resolve',
      messages: MOCK_MESSAGES,
      tickets: MOCK_TICKETS,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),
    }),
    {
      name: 'employee-portal-store',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

