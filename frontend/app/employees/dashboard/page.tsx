'use client';

import {
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Users,
  Search,
} from 'lucide-react';
import { cn } from '@employees/lib/utils';
import { useAuth } from '@app/auth/AuthContext';
import { ProtectedRoute } from '@app/auth/ProtectedRoute';
import { fetchEmployeeTickets, fetchEmployee } from '@lib/api';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

function EmployeeDashboardContent() {
  const { user } = useAuth();

  const { data: employeeData } = useQuery({
    queryKey: ['employee-profile', user?.id],
    queryFn: () => fetchEmployee(user!.id),
    enabled: !!user,
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['employee-tickets', user?.id],
    queryFn: () => fetchEmployeeTickets(user!.id),
    enabled: !!user,
  });

  // Sort tickets by severity (critical first)
  const sortedTickets = [...tickets].sort((a, b) => (b.severity || 0) - (a.severity || 0));
  
  const activeTickets = tickets.filter((t: any) => t.status !== 'resolved' && t.status !== 'complex_path_resolved');
  const criticalTickets = activeTickets.filter((t: any) => t.severity >= 4);

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#f8f7f9] dark:bg-[#0b0c10] overflow-hidden">
      {/* Header */}
      <header className="px-8 py-6 bg-white dark:bg-[#1a1b24] border-b border-[#eeecee] dark:border-white/5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#1e2a35] dark:text-[#f5f6fa]">Resolution Center</h1>
          <p className="text-sm text-[#5f5f62] dark:text-[#a0a5b5]">Welcome back, {user?.name}. You have {criticalTickets.length} critical issues pending.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Online & Available</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 scrollbar-hide space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#1a1b24] p-6 rounded-2xl border border-[#eeecee] dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Ticket size={20} />
              </div>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <p className="text-xs font-bold text-[#a0a5b5] uppercase tracking-widest mb-1">Total Assigned</p>
            <h3 className="text-2xl font-bold dark:text-white">{tickets.length}</h3>
          </div>
          <div className="bg-white dark:bg-[#1a1b24] p-6 rounded-2xl border border-[#eeecee] dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                <Zap size={20} />
              </div>
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <p className="text-xs font-bold text-[#a0a5b5] uppercase tracking-widest mb-1">Current Load</p>
            <h3 className="text-2xl font-bold dark:text-white">{employeeData?.current_load || 0}</h3>
          </div>
          <div className="bg-white dark:bg-[#1a1b24] p-6 rounded-2xl border border-[#eeecee] dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Clock size={20} />
              </div>
            </div>
            <p className="text-xs font-bold text-[#a0a5b5] uppercase tracking-widest mb-1">Avg Resolution</p>
            <h3 className="text-2xl font-bold dark:text-white">{employeeData?.avg_resolution_time || '0.0'}h</h3>
          </div>
          <div className="bg-white dark:bg-[#1a1b24] p-6 rounded-2xl border border-[#eeecee] dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle size={20} />
              </div>
            </div>
            <p className="text-xs font-bold text-[#a0a5b5] uppercase tracking-widest mb-1">Skill Score</p>
            <h3 className="text-2xl font-bold dark:text-white">{employeeData?.skill_level}/5</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket Queue */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" />
                Priority Ticket Queue
              </h2>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-[#f0f4f6] dark:bg-[#12131a] text-[11px] font-bold dark:text-gray-300 border border-transparent dark:border-white/5">All</button>
                <button className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#a0a5b5]">High Only</button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Clock className="animate-spin text-gray-400" />
              </div>
            ) : sortedTickets.length === 0 ? (
              <div className="bg-white dark:bg-[#1a1b24] rounded-2xl p-20 text-center border border-dashed border-[#eeecee] dark:border-white/10">
                <CheckCircle size={40} className="mx-auto text-emerald-500/30 mb-4" />
                <p className="text-[#a0a5b5] font-medium">All caught up! No assigned tickets.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTickets.map((ticket: any) => (
                  <div key={ticket.id} className="bg-white dark:bg-[#1a1b24] p-5 rounded-2xl border border-[#eeecee] dark:border-white/5 flex items-center justify-between hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm",
                        ticket.severity >= 5 ? "bg-red-500 text-white" :
                        ticket.severity >= 4 ? "bg-orange-500 text-white" :
                        "bg-blue-500 text-white"
                      )}>
                        {ticket.severity}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold dark:text-[#f5f6fa] group-hover:text-primary transition-colors">{ticket.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-[#a0a5b5] flex items-center gap-1 font-medium">
                            #{ticket.id} • {ticket.category || 'General'}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            ticket.status === 'assigned' ? "bg-primary/10 text-primary" : 
                            ticket.status === 'resolved' || ticket.status === 'complex_path_resolved' ? "bg-emerald-500/10 text-emerald-500" :
                            "bg-amber-500/10 text-amber-500"
                          )}>
                            {ticket.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-[#a0a5b5] uppercase font-bold tracking-widest">Time Elapsed</p>
                        <p className="text-xs font-semibold dark:text-gray-300">2h 15m</p>
                      </div>
                      <Link 
                        href={`/employees/resolve?ticket=${ticket.id}`}
                        className="w-10 h-10 rounded-xl bg-[#f8f7f9] dark:bg-[#12131a] flex items-center justify-center text-[#a0a5b5] hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        <ChevronRight size={20} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions & Messaging */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1a1b24] rounded-2xl p-6 border border-[#eeecee] dark:border-white/5 shadow-sm">
              <h3 className="text-sm font-bold dark:text-white mb-5 flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-500" />
                Collaboration Hub
              </h3>
              <div className="space-y-3">
                <Link href="/employees/chatbot" className="flex items-center gap-4 p-3 rounded-xl hover:bg-primary/10 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Users size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold dark:text-gray-200 group-hover:text-blue-600">Staff Messaging</p>
                    <p className="text-[11px] text-[#a0a5b5]">24 active employees</p>
                  </div>
                  <ChevronRight size={16} className="text-[#a0a5b5]" />
                </Link>
                <Link href="/employees/chatbot" className="flex items-center gap-4 p-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600">
                    <MessageSquare size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold dark:text-gray-200 group-hover:text-purple-600">Admin Support</p>
                    <p className="text-[11px] text-[#a0a5b5]">Direct line to IT Manager</p>
                  </div>
                  <ChevronRight size={16} className="text-[#a0a5b5]" />
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1e2a35] to-[#12131a] rounded-2xl p-6 text-white shadow-xl">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                Resolution Tips
              </h3>
              <p className="text-xs text-white/60 mb-4 leading-relaxed">
                Prioritize tickets with Severity 5 as they impact production systems directly. Use the 'Resolve' button to mark as completed.
              </p>
              <div className="pt-4 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/60">Tickets Today</span>
                  <span className="font-bold">12</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/60">Success Rate</span>
                  <span className="font-bold text-emerald-400">98%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function EmployeeDashboard() {
  return (
    <ProtectedRoute requiredRole="Employee">
      <EmployeeDashboardContent />
    </ProtectedRoute>
  );
}
