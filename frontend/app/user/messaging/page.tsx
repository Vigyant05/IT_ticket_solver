'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@app/auth/AuthContext';
import { ProtectedRoute } from '@app/auth/ProtectedRoute';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserTickets, fetchMessages, sendMessage, fetchTicket } from '@lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, 
  MessageSquare, 
  Send, 
  Mic, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  User,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '@user/lib/utils';

function MessagingPageContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketIdParam = searchParams.get('ticket');
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all user tickets to find assigned employees
  const { data: tickets = [], isLoading: isLoadingTickets, refetch } = useQuery({
    queryKey: ['user-tickets', user?.id],
    queryFn: () => fetchUserTickets(user!.id),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  // Filter for tickets with assigned agents that are not yet resolved
  const activeConversations = tickets.filter((t: any) => {
    const status = (t.status || '').toLowerCase();
    const hasAgent = !!t.assigned_employee_id || (!!t.assigned_agent_name && t.assigned_agent_name !== "Unassigned");
    return (
      status !== 'resolved' && 
      status !== 'complex_path_resolved' && 
      status !== 'closed' &&
      hasAgent
    );
  });

  // Auto-select ticket from URL if present
  useEffect(() => {
    if (ticketIdParam && tickets.length > 0) {
      const ticket = tickets.find((t: any) => t.id.toString() === ticketIdParam);
      if (ticket) {
        setSelectedTicket(ticket);
      }
    } else if (!selectedTicket && activeConversations.length > 0) {
      // Auto-select first active conversation if none selected
      setSelectedTicket(activeConversations[0]);
    }
  }, [ticketIdParam, tickets, activeConversations.length]);

  // Fetch messages for selected ticket
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', 'ticket', selectedTicket?.id],
    queryFn: () => fetchMessages({ ticket_id: selectedTicket?.id }),
    enabled: !!selectedTicket,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Send message mutation
  const myId = `User:${user?.id}`;
  const { mutate: sendMsg, isPending: isSending } = useMutation({
    mutationFn: (content: string) => sendMessage({
      ticket_id: selectedTicket.id,
      sender_id: myId,
      receiver_id: `Employee:${selectedTicket.assigned_employee_id}`,
      sender_name: user?.name || 'User',
      content
    }),
    onSuccess: () => {
      setInput('');
      queryClient.invalidateQueries({ queryKey: ['messages', 'ticket', selectedTicket?.id] });
    }
  });

  const handleSend = () => {
    if (input.trim() && selectedTicket) {
      sendMsg(input);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 flex h-screen overflow-hidden bg-[#f8f7f9] dark:bg-[#12131a]">
      {/* ── Left Sidebar: Conversations ────────────────── */}
      <div className="w-[320px] flex flex-col border-r border-[#eeecee] dark:border-white/5 bg-white dark:bg-[#1a1b24] shrink-0">
        <div className="p-6 border-b border-[#eeecee] dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold dark:text-[#f5f6fa]">Messages</h1>
            <button 
              onClick={() => refetch()}
              className="p-1.5 rounded-lg hover:bg-[#f8f7f9] dark:hover:bg-white/5 text-[#a0a5b5] transition-all"
              title="Refresh"
            >
              <Loader2 className={cn("w-4 h-4", isLoadingTickets && "animate-spin")} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a5b5]" size={16} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f6f3f4] dark:bg-[#252735] border border-transparent dark:border-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {isLoadingTickets ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="animate-spin text-primary/50" size={24} />
              <p className="text-xs text-[#a0a5b5] font-medium">Loading agents...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto text-[#a0a5b5]">
                <Clock size={24} />
              </div>
              <p className="text-sm text-[#a0a5b5] font-medium">No tickets raised yet.</p>
            </div>
          ) : activeConversations.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto text-[#a0a5b5]">
                <MessageSquare size={24} />
              </div>
              <p className="text-sm text-[#a0a5b5] font-medium">No active agents assigned.</p>
              <p className="text-[10px] text-[#a0a5b5]">Wait for an IT specialist to pick up your complex requests.</p>
            </div>
          ) : (
            activeConversations.map((ticket: any) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={cn(
                  "w-full p-4 flex items-center gap-4 hover:bg-[#f8f7f9] dark:hover:bg-white/[0.02] transition-all border-l-4",
                  selectedTicket?.id === ticket.id 
                    ? "bg-primary/5 dark:bg-primary/10 border-primary" 
                    : "border-transparent"
                )}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-lg">
                    {ticket.assigned_agent_name?.charAt(0) || 'E'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#1a1b24]" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-bold dark:text-[#f5f6fa] truncate">{ticket.assigned_agent_name}</p>
                    <span className="text-[10px] text-[#a0a5b5] font-medium">#{ticket.id}</span>
                  </div>
                  <p className="text-[11px] text-[#a0a5b5] truncate font-medium">{ticket.title}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right: Chat Window ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8f7f9] dark:bg-[#0b0c10]">
        {selectedTicket ? (
          <>
            {/* Header */}
            <header className="px-6 py-4 bg-white dark:bg-[#1a1b24] border-b border-[#eeecee] dark:border-white/5 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {selectedTicket.assigned_agent_name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-sm font-bold dark:text-[#f5f6fa]">{selectedTicket.assigned_agent_name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</span>
                    <span className="text-[10px] text-[#a0a5b5]">•</span>
                    <span className="text-[10px] text-[#a0a5b5] font-medium">Ticket #{selectedTicket.id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-[#f8f7f9] dark:hover:bg-white/5 text-[#a0a5b5] transition-all">
                  <Phone size={18} />
                </button>
                <button className="p-2 rounded-lg hover:bg-[#f8f7f9] dark:hover:bg-white/5 text-[#a0a5b5] transition-all">
                  <Video size={18} />
                </button>
                <button className="p-2 rounded-lg hover:bg-[#f8f7f9] dark:hover:bg-white/5 text-[#a0a5b5] transition-all">
                  <MoreVertical size={18} />
                </button>
              </div>
            </header>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
            >
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-primary/30" size={32} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary/30 mb-4">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-sm font-bold dark:text-gray-300">Start the conversation</h3>
                  <p className="text-xs text-[#a0a5b5] mt-1 max-w-[240px]">Messages are encrypted and direct to your assigned agent.</p>
                </div>
              ) : (
                messages.map((msg: any, idx: number) => {
                  const isMe = msg.sender_id === myId || msg.sender_id === 'User';
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex w-full",
                        isMe ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "max-w-[70%] space-y-1",
                        isMe ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                          isMe 
                            ? "bg-primary text-white rounded-tr-none" 
                            : "bg-white dark:bg-[#1a1b24] text-[#323235] dark:text-[#e2e4f0] rounded-tl-none border border-[#eeecee] dark:border-white/5"
                        )}>
                          {msg.content}
                        </div>
                        <div className={cn(
                          "flex items-center gap-1.5 px-1",
                          isMe ? "justify-end" : "justify-start"
                        )}>
                          <span className="text-[9px] text-[#a0a5b5] font-medium">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && <CheckCircle2 size={10} className="text-primary" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <div className="px-6 py-4 bg-white dark:bg-[#1a1b24] border-t border-[#eeecee] dark:border-white/5 shrink-0 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-xl hover:bg-[#f8f7f9] dark:hover:bg-white/5 text-[#a0a5b5] transition-all shrink-0">
                  <Paperclip size={20} />
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={`Message ${selectedTicket.assigned_agent_name}...`}
                    className="w-full px-4 py-3 bg-[#f6f3f4] dark:bg-[#252735] rounded-xl text-[13px] text-[#323235] dark:text-[#e2e4f0] placeholder:text-[#a0a5b5] focus:outline-none focus:ring-2 focus:ring-primary/30 border border-transparent dark:border-white/5 transition-all"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 text-primary transition-all">
                    <Mic size={18} />
                  </button>
                </div>
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                  className="w-12 h-12 rounded-xl bg-primary hover:opacity-90 flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-all shrink-0 disabled:opacity-50 disabled:shadow-none"
                >
                  {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white dark:bg-[#1a1b24] shadow-xl flex items-center justify-center text-primary mb-6 animate-pulse">
              <MessageSquare size={40} />
            </div>
            <h2 className="text-xl font-bold dark:text-[#f5f6fa] mb-2">Your Conversations</h2>
            <p className="text-sm text-[#a0a5b5] max-w-xs">Select a support request from the list to start messaging with your assigned IT agent.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagingPage() {
  return (
    <ProtectedRoute requiredRole="User">
      <MessagingPageContent />
    </ProtectedRoute>
  );
}
