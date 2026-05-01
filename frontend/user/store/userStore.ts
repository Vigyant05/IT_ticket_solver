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

  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setActiveTab: (tab: 'service-desk' | 'ticket-history') => void;
  addMessage: (msg: Message) => void;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    role: 'assistant',
    content:
      "Hello! I'm your Architectural Ledger Assistant. How can I help you today? You can report technical issues, request access, or ask about system features.",
    timestamp: '10:24 AM',
  },
  {
    id: 'm2',
    role: 'user',
    content:
      "I'm having trouble synchronizing my local vault with the main ledger. I keep getting \"Error 404: Node Unavailable\".",
    timestamp: '10:35 AM',
  },
  {
    id: 'm3',
    role: 'assistant',
    content:
      'I understand. "Error 404: Node Unavailable" usually indicates a network gateway timeout in the Architectural Ledger core. Let me check your current connection status.',
    timestamp: '10:25 AM',
    actions: [
      { label: 'Run Diagnostics', variant: 'secondary' },
      { label: 'View Error Log', variant: 'secondary' },
    ],
  },
  {
    id: 'm4',
    role: 'user',
    content: "I've tried running diagnostics and it says everything is fine locally.",
    timestamp: '10:26 AM',
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
  },
  {
    id: 'TKT-4790',
    subject: 'Access Request: Ledger Admin Panel',
    status: 'resolved',
    priority: 'medium',
    createdAt: '2026-04-20T08:00:00Z',
    updatedAt: '2026-04-22T14:30:00Z',
  },
  {
    id: 'TKT-4755',
    subject: 'Vault sync failure on subnet B',
    status: 'closed',
    priority: 'low',
    createdAt: '2026-04-10T11:00:00Z',
    updatedAt: '2026-04-12T16:00:00Z',
  },
  {
    id: 'TKT-4710',
    subject: 'Hardware wallet pairing issue',
    status: 'resolved',
    priority: 'medium',
    createdAt: '2026-04-05T09:00:00Z',
    updatedAt: '2026-04-07T10:00:00Z',
  },
  {
    id: 'TKT-4680',
    subject: 'Ledger key reset request',
    status: 'closed',
    priority: 'low',
    createdAt: '2026-03-28T12:00:00Z',
    updatedAt: '2026-03-29T15:00:00Z',
  },
];

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeTab: 'service-desk',
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
      name: 'user-portal-store',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
