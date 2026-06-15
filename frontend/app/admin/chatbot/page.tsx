'use client';

import { Search, Bell, Settings, Send, Paperclip, Database, User, Bot, Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@app/auth/ProtectedRoute';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEmployees, fetchMessages, sendMessage, markMessagesRead } from '@lib/api';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@app/auth/AuthContext';
import { toast } from 'sonner';
import { cn } from '@admin/lib/utils';

function ChatbotContent() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
   const [activeContact, setActiveContact] = useState<any>(null);
   const [messageInput, setMessageInput] = useState('');
   const scrollRef = useRef<HTMLDivElement>(null);

   const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
      queryKey: ['admin-employees', 'with-users'],
      queryFn: () => fetchEmployees(true)
   });

   // Fetch all messages involving Admin
   const { data: allMessages = [] } = useQuery({
      queryKey: ['messages', 'Admin'],
      queryFn: () => fetchMessages({ user1: 'Admin' }),
      refetchInterval: 3000 // Poll for new messages every 3s
   });

   // Derive messages for active contact
   const messages = activeContact 
      ? allMessages.filter((m: any) => m.sender_id === activeContact.idStr || m.receiver_id === activeContact.idStr)
      : [];

   // Compute Inbox contacts sorted by unread count then most recent message
   const inboxContacts = [...employees].map((emp: any) => {
      const empId = emp.role === 'User' ? `User:${emp.id}` : `Employee:${emp.id}`;
      const threadMsgs = allMessages.filter((m: any) => m.sender_id === empId || m.receiver_id === empId);
      const lastMsg = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1] : null;
      const unreadCount = threadMsgs.filter((m: any) => m.sender_id === empId && !m.is_read).length;
      return {
         ...emp,
         idStr: empId,
         lastMessageTime: lastMsg ? new Date(lastMsg.timestamp).getTime() : 0,
         lastMessageText: lastMsg ? lastMsg.content : null,
         unreadCount: unreadCount
      };
   }).sort((a: any, b: any) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      return b.lastMessageTime - a.lastMessageTime;
   });

   const { mutate: sendMsg, isPending } = useMutation({
      mutationFn: (content: string) => sendMessage({
         sender_id: 'Admin',
         receiver_id: activeContact.idStr,
         sender_name: user?.name || 'Admin',
         content
      }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['messages'] });
         setMessageInput('');
      },
      onError: () => toast.error('Failed to send message')
   });

   useEffect(() => {
      if (activeContact && messages.length > 0) {
         const hasUnread = messages.some((m: any) => m.sender_id === activeContact.idStr && !m.is_read);
         if (hasUnread) {
            markMessagesRead({ sender_id: activeContact.idStr, receiver_id: 'Admin' }).then(() => {
               queryClient.invalidateQueries({ queryKey: ['messages'] });
            }).catch(console.error);
         }
      }
   }, [activeContact, messages, queryClient]);

   useEffect(() => {
      if (scrollRef.current) {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
   }, [messages]);

   const handleSend = () => {
      if (!messageInput.trim() || !activeContact) return;
      sendMsg(messageInput);
   };

   return (
      <div className="min-h-screen bg-[#fcf8f9] dark:bg-[#12131a] text-[#323235] dark:text-[#f5f6fa] p-4 lg:p-8 font-sans flex flex-col h-screen overflow-hidden">
         {/* Top Bar */}
         <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="relative w-[28rem] max-w-full">
               <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f5f62] dark:text-[#a0a5b5]" />
               <input
                  type="text"
                  placeholder="Search contacts..."
                  className="w-full pl-10 pr-4 py-2 bg-[#f6f3f4] dark:bg-[#1e1f29] rounded-full text-[13px] placeholder:text-[#5f5f62] dark:placeholder:text-[#a0a5b5] text-[#323235] dark:text-[#f5f6fa] border border-transparent dark:border-white/5 focus:outline-none focus:ring-[2px] focus:ring-[#172229]/40 focus:bg-[#ffffff] dark:focus:bg-[#252735]"
               />
            </div>
            <div className="flex items-center gap-6">
               <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden border border-[#b2b1b5]/15 dark:border-white/10 cursor-pointer shrink-0">
                  <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
               </div>
            </div>
         </div>

         {/* Header */}
         <div className="mb-6 shrink-0">
            <h1 className="text-2xl font-manrope font-bold text-[#172229] dark:text-primary mb-1.5 leading-tight">
               Employee Messaging
            </h1>
            <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-sm max-w-3xl leading-relaxed">
               Directly chat with IT engineers, L2 specialists, and DevOps team members to collaborate on complex tickets.
            </p>
         </div>

         {/* Main Content Area */}
         <div className="flex gap-6 flex-1 min-h-0">

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col bg-[#ffffff] dark:bg-[#1a1b24] rounded-xl shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 overflow-hidden">
               
               {/* Output Area */}
               <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                  {!activeContact ? (
                     <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                        <Bot size={48} className="mb-4 opacity-50" />
                        <p>Select an employee from the right to start messaging</p>
                     </div>
                  ) : messages.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                        <p>No messages yet.</p>
                     </div>
                  ) : (
                     messages.map((msg: any) => {
                        const isAdmin = msg.sender_id === 'Admin';
                        return (
                           <div key={msg.id} className={cn("flex gap-4 max-w-[85%]", isAdmin ? "ml-auto justify-end" : "")}>
                              {!isAdmin && (
                                 <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/10 flex items-center justify-center shrink-0 text-[#172229] dark:text-primary">
                                    <User size={18} />
                                 </div>
                              )}
                              <div className={cn(
                                 "p-4 rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap",
                                 isAdmin 
                                    ? "bg-primary text-[#ffffff] rounded-tr-sm shadow-[0px_4px_12px_rgba(59,99,123,0.15)] dark:shadow-[0px_4px_12px_rgba(0,0,0,0.3)]"
                                    : "bg-[#f6f3f4] dark:bg-[#252735] text-[#323235] dark:text-[#f5f6fa] rounded-tl-sm shadow-sm dark:shadow-none dark:border dark:border-white/5"
                              )}>
                                 {msg.content}
                                 <div className={cn(
                                    "text-[10px] font-semibold tracking-wider uppercase mt-2",
                                    isAdmin ? "text-white/70" : "text-[#5f5f62] dark:text-[#a0a5b5]"
                                 )}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {msg.sender_name}
                                 </div>
                              </div>
                              {isAdmin && (
                                 <div className="w-8 h-8 rounded-lg bg-[#e3ecf1] dark:bg-[#2d3a4a] flex items-center justify-center shrink-0 text-[#172229] dark:text-[#7bb0d6]">
                                    <img src="https://i.pravatar.cc/150?img=11" alt="Admin" className="w-full h-full object-cover rounded-lg" />
                                 </div>
                              )}
                           </div>
                        );
                     })
                  )}
               </div>

               {/* Input Area */}
               <div className="p-5 bg-[#fcf8f9]/50 dark:bg-[#12131a]/50 border-t border-[#f6f3f4] dark:border-white/5">
                  <div className="relative flex items-center">
                     <input
                        type="text"
                        disabled={!activeContact || isPending}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={activeContact ? `Message ${activeContact.name}...` : "Select an employee to message..."}
                        className="w-full bg-[#ffffff] dark:bg-[#252735] border border-[#f6f3f4] dark:border-white/5 rounded-lg py-2.5 pl-4 pr-14 text-sm text-[#323235] dark:text-[#f5f6fa] placeholder:text-[#b2b1b5] dark:placeholder:text-[#a0a5b5] focus:outline-none focus:ring-2 focus:ring-[#172229]/30 shadow-sm disabled:opacity-50"
                     />
                     <button 
                        onClick={handleSend}
                        disabled={!activeContact || isPending || !messageInput.trim()}
                        className="absolute right-2 w-8 h-8 rounded-md bg-primary dark:bg-primary flex items-center justify-center text-white hover:bg-primary dark:hover:bg-primary/80 disabled:opacity-50"
                     >
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="translate-x-[-1px] translate-y-[1px]" />}
                     </button>
                  </div>
                  <div className="flex gap-5 mt-3 pl-2 text-xs text-[#5f5f62] dark:text-[#a0a5b5] font-semibold">
                     <button className="flex items-center gap-1.5 hover:text-[#172229] dark:hover:text-[#ffffff] disabled:opacity-50" disabled={!activeContact}>
                        <Paperclip size={14} /> Attach File
                     </button>
                  </div>
               </div>

            </div>

            {/* Right Sidebar - Active Contacts */}
            <div className="w-[300px] shrink-0 flex flex-col h-full bg-transparent">
               <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                  <h3 className="font-bold text-[10px] tracking-widest uppercase text-[#5f5f62] dark:text-[#a0a5b5]">Directory Contacts</h3>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#172229] dark:text-primary">{employees.length} Online</span>
               </div>

               <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide pb-4">
                  {isLoadingEmployees ? (
                     <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                  ) : inboxContacts.map((emp: any) => (
                     <div 
                        key={emp.id} 
                        onClick={() => setActiveContact(emp)}
                        className={cn(
                           "bg-[#ffffff] dark:bg-[#252735] rounded-xl p-4 shadow-[0px_4px_16px_rgba(13,60,82,0.03)] dark:shadow-none dark:border dark:border-white/5 cursor-pointer transition-colors relative",
                           activeContact?.id === emp.id ? "ring-2 ring-primary dark:ring-[#7bb0d6]" : "hover:bg-[#fcf8f9] dark:hover:bg-[#2e3040]"
                        )}
                     >
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-0.5">
                                 <h4 className="font-semibold text-[#323235] dark:text-[#f5f6fa] text-[13px] leading-tight truncate">{emp.name}</h4>
                                 {emp.lastMessageTime > 0 && (
                                    <span className="text-[10px] text-[#a0a5b5]">
                                       {new Date(emp.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                 )}
                              </div>
                                 <div className="flex justify-between items-center">
                                    <p className="text-[11px] text-[#5f5f62] dark:text-[#a0a5b5] truncate max-w-[160px]">
                                       {emp.lastMessageText || emp.team}
                                    </p>
                                    {emp.unreadCount > 0 && (
                                       <span className="bg-blue-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full ml-2 leading-none min-w-[20px] text-center">
                                          {emp.unreadCount}
                                       </span>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
}

export default function ChatbotPage() {
  return (
    <ProtectedRoute requiredRole="Admin">
      <ChatbotContent />
    </ProtectedRoute>
  );
}
