'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  Clock,
  CheckCircle,
  PlusCircle,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  Send,
  Headphones,
} from 'lucide-react';
import { cn } from '@user/lib/utils';
import { useAuth } from '@app/auth/AuthContext';
import { ProtectedRoute } from '@app/auth/ProtectedRoute';
import { fetchUserTickets, submitTicketToPipeline } from '@lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';

function UserDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [quickTicketText, setQuickTicketText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['user-tickets', user?.id],
    queryFn: () => fetchUserTickets(user!.id),
    enabled: !!user,
  });

  const { mutate: raiseTicket, isPending: isRaising } = useMutation({
    mutationFn: (text: string) => submitTicketToPipeline({
      ticket_id: `TKT-${Date.now()}`,
      ticket_text: text,
      requester_name: user?.name || 'User',
    }),
    onSuccess: () => {
      toast.success('Ticket raised successfully!');
      setQuickTicketText('');
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] });
    },
    onError: () => {
      toast.error('Failed to raise ticket.');
    }
  });

  const filteredTickets = tickets.filter((t: any) => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toString().includes(searchTerm)
  );

  const openTickets = filteredTickets.filter((t: any) => t.status === 'open' || t.status === 'assigned');
  const resolvedTickets = filteredTickets.filter((t: any) => t.status === 'resolved' || t.status === 'complex_path_resolved');

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#f8f7f9] dark:bg-[#0b0c10] overflow-hidden">
      {/* Header */}
      <header className="px-8 py-6 bg-white dark:bg-[#1a1b24] border-b border-[#eeecee] dark:border-white/5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#1e2a35] dark:text-[#f5f6fa]">Welcome back, {user?.name}</h1>
          <p className="text-sm text-[#5f5f62] dark:text-[#a0a5b5]">Track your IT support requests and get help instantly.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a5b5]" size={16} />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg bg-[#f6f3f4] dark:bg-[#12131a] border border-transparent dark:border-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
            />
          </div>
          <button 
            onClick={() => router.push('/user/support')}
            className="p-2 rounded-lg bg-primary text-white hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <PlusCircle size={18} />
            <span className="text-sm font-semibold">New Request</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 scrollbar-hide space-y-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#1a1b24] p-6 rounded-2xl shadow-sm border border-[#eeecee] dark:border-white/5 flex items-center gap-5 group hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Ticket size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#5f5f62] dark:text-[#a0a5b5]">Total Tickets</p>
              <h3 className="text-2xl font-bold dark:text-white">{tickets.length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1b24] p-6 rounded-2xl shadow-sm border border-[#eeecee] dark:border-white/5 flex items-center gap-5 group hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#5f5f62] dark:text-[#a0a5b5]">Open Requests</p>
              <h3 className="text-2xl font-bold dark:text-white">{openTickets.length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1b24] p-6 rounded-2xl shadow-sm border border-[#eeecee] dark:border-white/5 flex items-center gap-5 group hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <CheckCircle size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#5f5f62] dark:text-[#a0a5b5]">Resolved</p>
              <h3 className="text-2xl font-bold dark:text-white">{resolvedTickets.length}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Active Tickets List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                <AlertCircle size={20} className="text-amber-500" />
                Active Support Requests
              </h2>
              <Link href="/user/history" className="text-sm text-primary hover:underline font-medium">View All</Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Clock className="animate-spin text-gray-400" />
              </div>
            ) : openTickets.length === 0 ? (
              <div className="bg-white dark:bg-[#1a1b24] rounded-2xl p-10 border border-dashed border-[#eeecee] dark:border-white/10 text-center">
                <p className="text-[#a0a5b5]">No active tickets found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {openTickets.map((ticket: any) => (
                  <div key={ticket.id} className="bg-white dark:bg-[#1a1b24] p-5 rounded-2xl border border-[#eeecee] dark:border-white/5 flex items-center justify-between hover:border-primary/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        ticket.severity >= 4 ? "bg-red-50 text-red-500 dark:bg-red-500/10" : "bg-primary/10 text-primary"
                      )}>
                        <Ticket size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold dark:text-[#f5f6fa] group-hover:text-primary transition-colors">{ticket.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-[#a0a5b5] flex items-center gap-1">
                            <Clock size={12} /> {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            ticket.status === 'assigned' ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-500"
                          )}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-[#a0a5b5] uppercase font-bold tracking-widest">Assigned To</p>
                        <p className="text-xs font-semibold dark:text-gray-300">{ticket.assigned_agent_name || 'System Router'}</p>
                      </div>
                      <Link 
                        href={`/user/messaging?ticket=${ticket.id}`}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-[#a0a5b5] transition-colors"
                      >
                        <ChevronRight size={20} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Direct Help Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/user/support" className="bg-white dark:bg-[#1a1b24] rounded-2xl p-5 border border-[#eeecee] dark:border-white/5 flex items-center gap-4 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold dark:text-white group-hover:text-purple-500 transition-colors">AI Support Assistant</h3>
              <p className="text-[11px] text-[#a0a5b5]">Talk to our AI for instant help and automated troubleshooting.</p>
            </div>
            <ChevronRight size={18} className="ml-auto text-[#a0a5b5]" />
          </Link>
          <Link href="/user/messaging" className="bg-white dark:bg-[#1a1b24] rounded-2xl p-5 border border-[#eeecee] dark:border-white/5 flex items-center gap-4 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Headphones size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold dark:text-white group-hover:text-orange-500 transition-colors">Direct IT Support</h3>
              <p className="text-[11px] text-[#a0a5b5]">Available 24/7 for critical issues and employee messaging.</p>
            </div>
            <ChevronRight size={18} className="ml-auto text-[#a0a5b5]" />
          </Link>
        </div>

      </main>
    </div>
  );
}

export default function UserDashboard() {
  return (
    <ProtectedRoute requiredRole="User">
      <UserDashboardContent />
    </ProtectedRoute>
  );
}
