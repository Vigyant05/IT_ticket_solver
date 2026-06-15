'use client';

import { Search, Send, Paperclip, Bot, Loader2, User as UserIcon, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ProtectedRoute } from '@app/auth/ProtectedRoute';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMessages, sendMessage, fetchAllTickets, resolveTicket } from '@lib/api';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@app/auth/AuthContext';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { cn } from '@employees/lib/utils';

function ResolvePageContent() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
   const [activeContact, setActiveContact] = useState<any>(null);
   const [messageInput, setMessageInput] = useState('');
   const scrollRef = useRef<HTMLDivElement>(null);

   const myId = `Employee:${user?.id}`;

   // Fetch all tickets to find which users this employee is assigned to
   const { data: tickets = [] } = useQuery({
      queryKey: ['employee-tickets'],
      queryFn: fetchAllTickets,
   });

   const searchParams = useSearchParams();
   const ticketIdParam = searchParams.get('ticket');

   useEffect(() => {
      if (ticketIdParam && tickets.length > 0) {
         const t = tickets.find((tk: any) => tk.id.toString() === ticketIdParam);
         if (t) {
            setActiveContact({
               id: `User:${t.id}`,
               ticketId: t.id,
               name: t.requester_name || 'User',
               type: 'User',
               role: `Ticket TKT-${t.id.toString().padStart(4, '0')}`
            });
         }
      }
   }, [ticketIdParam, tickets]);

   // Filter tickets assigned to this employee
   const myTickets = tickets.filter((t: any) => t.assigned_employee_id === user?.id && !t.status?.includes('resolved') && t.status !== 'closed');

   // Sort tickets so critical comes first
   myTickets.sort((a: any, b: any) => (b.priority_score || 0) - (a.priority_score || 0));

   const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
      queryKey: ['messages', myId, activeContact?.id],
      queryFn: () => {
         if (activeContact?.type === 'Admin') {
            return fetchMessages({ user1: myId, user2: 'Admin' });
         } else if (activeContact?.type === 'User') {
            return fetchMessages({ ticket_id: activeContact.ticketId });
         }
         return [];
      },
      enabled: !!activeContact,
      refetchInterval: 3000
   });

   const { mutate: sendMsg, isPending } = useMutation({
      mutationFn: (content: string) => {
         const payload: any = {
            sender_id: myId,
            sender_name: user?.name || 'Employee',
            content
         };
         if (activeContact.type === 'Admin') {
            payload.receiver_id = 'Admin';
         } else {
            payload.receiver_id = activeContact.id;
            payload.ticket_id = activeContact.ticketId;
         }
         return sendMessage(payload);
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['messages'] });
         setMessageInput('');
      },
      onError: () => toast.error('Failed to send message')
   });

   const { mutate: handleResolve, isPending: isResolving } = useMutation({
      mutationFn: async () => {
         if (!activeContact || activeContact.type !== 'User') return;
         await resolveTicket(activeContact.ticketId);
      },
      onSuccess: () => {
         toast.success('Ticket resolved successfully!');
         queryClient.invalidateQueries({ queryKey: ['employee-tickets'] });
         setActiveContact(null);
      },
      onError: () => toast.error('Failed to resolve ticket')
   });

   useEffect(() => {
      if (scrollRef.current) {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
   }, [messages]);

   const handleSend = () => {
      if (!messageInput.trim() || !activeContact) return;
      sendMsg(messageInput);
   };

   const contacts = [
      { id: 'Admin', name: 'Admin_System', type: 'Admin', role: 'System Administrator' },
      ...myTickets.map((t: any) => ({
         id: `User:${t.id}`,
         ticketId: t.id,
         name: t.requester_name || 'User',
         type: 'User',
         role: `Ticket TKT-${t.id.toString().padStart(4, '0')}`
      }))
   ];

   if (!activeContact) {
      return (
         <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8f7f9] dark:bg-[#12131a] text-[#323235] dark:text-[#f5f6fa]">
            <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
               <div className="mb-8">
                  <h1 className="text-[32px] font-manrope font-bold text-[#1e2a35] dark:text-[#e8edf5] leading-tight tracking-tight">
                     Employee Dashboard
                  </h1>
                  <p className="text-[13px] text-[#5f5f62] dark:text-[#a0a5b5] mt-1">
                     Manage your assigned tickets and direct communications.
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                  <div className="bg-white dark:bg-[#1a1b24] p-5 rounded-xl shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5">
                     <div className="text-[11px] font-bold tracking-widest uppercase text-[#5f5f62] dark:text-[#a0a5b5] mb-2">Active Tickets</div>
                     <div className="text-[32px] font-manrope font-bold text-primary dark:text-primary leading-none">{myTickets.length}</div>
                  </div>
                  <div className="bg-white dark:bg-[#1a1b24] p-5 rounded-xl shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5">
                     <div className="text-[11px] font-bold tracking-widest uppercase text-[#5f5f62] dark:text-[#a0a5b5] mb-2">Critical Issues</div>
                     <div className="text-[32px] font-manrope font-bold text-red-500 leading-none">{myTickets.filter((t: any) => t.priority_score > 7).length}</div>
                  </div>
               </div>

               <div className="flex flex-col xl:flex-row gap-8 items-start">
                  <div className="flex-1 flex flex-col gap-4 w-full">
                     <h3 className="font-bold text-[14px] text-[#323235] dark:text-[#e2e4f0]">Assigned Tickets</h3>
                     <div className="bg-white dark:bg-[#1a1b24] rounded-xl shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5 overflow-hidden">
                        <div className="grid grid-cols-[100px_1fr_120px_100px] gap-4 px-5 py-3 border-b border-[#f0eff0] dark:border-white/5 text-[10px] font-bold tracking-widest uppercase text-[#a0a5b5]">
                           <span>Ticket ID</span>
                           <span>Subject</span>
                           <span>Status</span>
                           <span>Priority</span>
                        </div>
                        {myTickets.length === 0 ? (
                           <div className="py-8 text-center text-[13px] text-muted-foreground">No active tickets assigned to you.</div>
                        ) : (
                           myTickets.map((t: any) => (
                              <div 
                                 key={t.id} 
                                 onClick={() => setActiveContact(contacts.find(c => c.ticketId === t.id))}
                                 className="grid grid-cols-[100px_1fr_120px_100px] gap-4 px-5 py-4 items-center hover:bg-[#f8f7f9] dark:hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-[#f0eff0] dark:border-white/5 last:border-0"
                              >
                                 <span className="text-[12px] font-mono font-bold text-primary dark:text-primary">TKT-{t.id.toString().padStart(4,'0')}</span>
                                 <span className="text-[13px] font-medium text-[#323235] dark:text-[#e2e4f0] truncate">{t.title}</span>
                                 <span className="text-[11px] uppercase tracking-wide font-bold">{t.status.replace('_', ' ')}</span>
                                 <span className={cn("text-[11px] font-bold", t.priority_score > 7 ? 'text-red-500' : t.priority_score > 5 ? 'text-orange-500' : 'text-amber-500')}>
                                    {t.priority_score > 7 ? 'CRITICAL' : t.priority_score > 5 ? 'HIGH' : 'MEDIUM'}
                                 </span>
                              </div>
                           ))
                        )}
                     </div>
                  </div>

                  <div className="w-full xl:w-[320px] flex flex-col gap-4 shrink-0">
                     <h3 className="font-bold text-[14px] text-[#323235] dark:text-[#e2e4f0]">Direct Messages</h3>
                     <div className="bg-white dark:bg-[#1a1b24] rounded-xl shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5 overflow-hidden flex flex-col p-2 space-y-2">
                        {contacts.filter((c: any) => c.type === 'Admin').map((contact: any) => (
                           <div 
                              key={contact.id}
                              onClick={() => setActiveContact(contact)}
                              className="p-3 rounded-lg hover:bg-[#fcf8f9] dark:hover:bg-[#252735] cursor-pointer transition-colors flex items-center gap-3"
                           >
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                 {contact.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                 <h4 className="font-bold text-[13px] text-[#323235] dark:text-[#e2e4f0] truncate">{contact.name}</h4>
                                 <p className="text-[10px] text-[#a0a5b5] font-semibold truncate">{contact.role}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8f7f9] dark:bg-[#12131a] text-[#323235] dark:text-[#f5f6fa]">
         <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide flex flex-col">
               
               <div className="mb-6 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                     <button 
                        onClick={() => setActiveContact(null)}
                        className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1b24] flex items-center justify-center text-[#5f5f62] dark:text-[#a0a5b5] hover:text-[#323235] dark:hover:text-white shadow-sm transition-colors border border-[#f0eff0] dark:border-white/5"
                     >
                        <ArrowLeft size={20} />
                     </button>
                     <div>
                        <h1 className="text-[24px] font-manrope font-bold text-[#1e2a35] dark:text-[#e8edf5] leading-tight tracking-tight">
                           {activeContact.name}
                        </h1>
                        <p className="text-[12px] text-[#5f5f62] dark:text-[#a0a5b5] font-semibold mt-0.5">{activeContact.role}</p>
                     </div>
                  </div>
                  
                  {activeContact.type === 'User' && (
                     <button
                        onClick={() => handleResolve()}
                        disabled={isResolving}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[13px] font-bold shadow-sm transition-colors disabled:opacity-50"
                     >
                        {isResolving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Resolve Ticket
                     </button>
                  )}
               </div>

               <div className="flex gap-5 flex-1 min-h-0">
                  {/* Chat Interface */}
                  <div className="flex-1 flex flex-col bg-white dark:bg-[#1a1b24] rounded-xl shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5 overflow-hidden">
                     <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                        {isLoadingMessages ? (
                           <div className="h-full flex items-center justify-center">
                              <Loader2 className="animate-spin text-muted-foreground" />
                           </div>
                        ) : messages.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                              <p>No messages yet.</p>
                           </div>
                        ) : (
                           messages.map((msg: any) => {
                              const isMe = msg.sender_id === myId;
                              return (
                                 <div key={msg.id} className={cn("flex gap-4 max-w-[85%]", isMe ? "ml-auto justify-end" : "")}>
                                    {!isMe && (
                                       <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/10 flex items-center justify-center shrink-0 text-primary dark:text-primary">
                                          <UserIcon size={18} />
                                       </div>
                                    )}
                                    <div className={cn(
                                       "p-4 rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap",
                                       isMe 
                                          ? "bg-primary dark:bg-primary text-white rounded-tr-sm shadow-sm"
                                          : "bg-[#f6f5f5] dark:bg-[#252735] text-[#323235] dark:text-[#e2e4f0] rounded-tl-sm shadow-sm dark:border dark:border-white/5"
                                    )}>
                                       {msg.content}
                                       <div className={cn(
                                          "text-[10px] font-semibold tracking-wider uppercase mt-2",
                                          isMe ? "text-white/70" : "text-[#5f5f62] dark:text-[#a0a5b5]"
                                       )}>
                                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {msg.sender_name}
                                       </div>
                                    </div>
                                    {isMe && (
                                       <div className="w-8 h-8 rounded-lg bg-[#e3ecf1] dark:bg-[#2d3a4a] flex items-center justify-center shrink-0 text-[#172229] dark:text-[#7bb0d6]">
                                          <UserIcon size={18} />
                                       </div>
                                    )}
                                 </div>
                              );
                           })
                        )}
                     </div>

                     <div className="p-4 bg-[#faf9fa] dark:bg-[#12131a]/60 border-t border-[#f0eff0] dark:border-white/5">
                        <div className="relative flex items-center">
                           <input
                              type="text"
                              disabled={isPending}
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                              placeholder={`Message ${activeContact.name}...`}
                              className="w-full bg-[#f6f3f4] dark:bg-[#252735] border border-transparent dark:border-white/5 rounded-lg py-2.5 pl-4 pr-14 text-sm text-[#323235] dark:text-[#e2e4f0] placeholder:text-[#b2b1b5] dark:placeholder:text-[#a0a5b5] focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm disabled:opacity-50"
                           />
                           <button 
                              onClick={handleSend}
                              disabled={isPending || !messageInput.trim()}
                              className="absolute right-2 w-8 h-8 rounded-md bg-primary dark:bg-primary flex items-center justify-center text-white hover:bg-primary/80 disabled:opacity-50 transition-colors"
                           >
                              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="translate-x-[-1px] translate-y-[1px]" />}
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Right Sidebar - Inbox (for quick switching) */}
                  <div className="w-[280px] shrink-0 flex flex-col h-full bg-transparent">
                     <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                        <h3 className="font-bold text-[11px] tracking-widest uppercase text-[#5f5f62] dark:text-[#a0a5b5]">Inbox</h3>
                     </div>

                     <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide pb-4">
                        {contacts.map((contact: any) => (
                           <div 
                              key={contact.id} 
                              onClick={() => setActiveContact(contact)}
                              className={cn(
                                 "bg-white dark:bg-[#1a1b24] rounded-xl p-4 shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5 cursor-pointer transition-colors",
                                 activeContact?.id === contact.id ? "ring-2 ring-primary dark:ring-primary" : "hover:bg-[#fcf8f9] dark:hover:bg-[#252735]"
                              )}
                           >
                              <div className="flex items-center justify-between mb-3">
                                 <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                       {contact.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                       <h4 className="font-bold text-[#323235] dark:text-[#e2e4f0] text-[13px] leading-tight truncate">{contact.name}</h4>
                                       <p className="text-[10px] text-[#5f5f62] dark:text-[#a0a5b5] font-semibold mt-0.5 truncate">{contact.role}</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

               </div>
            </div>
         </div>
      </div>
   );
}

export default function ResolvePage() {
  return (
    <ProtectedRoute requiredRole="Employee">
      <ResolvePageContent />
    </ProtectedRoute>
  );
}
