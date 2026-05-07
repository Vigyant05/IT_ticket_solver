'use client';

import { Search, Send, Paperclip, Bot, Loader2, User as UserIcon } from 'lucide-react';
import { ProtectedRoute } from '@app/auth/ProtectedRoute';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEmployees, fetchMessages, sendMessage } from '@lib/api';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@app/auth/AuthContext';
import { toast } from 'sonner';
import { cn } from '@employees/lib/utils';

function EmployeeChatbotContent() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
   const [activeContact, setActiveContact] = useState<any>(null);
   const [messageInput, setMessageInput] = useState('');
   const scrollRef = useRef<HTMLDivElement>(null);

   const myId = `Employee:${user?.id}`;

   const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
      queryKey: ['admin-employees'],
      queryFn: fetchEmployees
   });

   // Fetch all messages involving this employee
   const { data: allMessages = [] } = useQuery({
      queryKey: ['messages', myId],
      queryFn: () => fetchMessages({ user1: myId }),
      refetchInterval: 3000 // Poll for new messages every 3s
   });

   // Derive messages for active contact
   const messages = activeContact 
      ? allMessages.filter((m: any) => m.sender_id === activeContact.id || m.receiver_id === activeContact.id)
      : [];

   // Compute Inbox contacts sorted by most recent message
   const allContacts = [
      { id: 'Admin', name: 'Admin_System', role: 'System Administrator' },
      ...employees.filter((e: any) => e.id !== user?.id).map((e: any) => ({
         id: `Employee:${e.id}`,
         name: e.name,
         role: e.team
      }))
   ];

   const inboxContacts = allContacts.map((contact: any) => {
      const threadMsgs = allMessages.filter((m: any) => m.sender_id === contact.id || m.receiver_id === contact.id);
      const lastMsg = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1] : null;
      return {
         ...contact,
         lastMessageTime: lastMsg ? new Date(lastMsg.timestamp).getTime() : 0,
         lastMessageText: lastMsg ? lastMsg.content : null,
         messageCount: threadMsgs.length
      };
   }).sort((a: any, b: any) => b.lastMessageTime - a.lastMessageTime);

   const { mutate: sendMsg, isPending } = useMutation({
      mutationFn: (content: string) => sendMessage({
         sender_id: myId,
         receiver_id: activeContact.id,
         sender_name: user?.name || 'Employee',
         content
      }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['messages'] });
         setMessageInput('');
      },
      onError: () => toast.error('Failed to send message')
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

   return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8f7f9] dark:bg-[#12131a] text-[#323235] dark:text-[#f5f6fa]">
         <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide flex flex-col">
               
               <div className="mb-6 flex items-center justify-between shrink-0">
                  <div>
                     <h1 className="text-[32px] font-manrope font-bold text-[#1e2a35] dark:text-[#e8edf5] leading-tight tracking-tight">
                        Internal Chat
                     </h1>
                     <p className="text-[13px] text-[#5f5f62] dark:text-[#a0a5b5] mt-1">
                        Direct messaging with Admin and other employees.
                     </p>
                  </div>
               </div>

               <div className="flex gap-5 flex-1 min-h-0">
                  {/* Chat Interface */}
                  <div className="flex-1 flex flex-col bg-white dark:bg-[#1a1b24] rounded-xl shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5 overflow-hidden">
                     <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                        {!activeContact ? (
                           <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                              <Bot size={48} className="mb-4 opacity-50" />
                              <p>Select a contact from the right to start messaging</p>
                           </div>
                        ) : messages.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                              <p>No messages yet. Say hi to {activeContact.name}!</p>
                           </div>
                        ) : (
                           messages.map((msg: any) => {
                              const isMe = msg.sender_id === myId;
                              return (
                                 <div key={msg.id} className={cn("flex gap-4 max-w-[85%]", isMe ? "ml-auto justify-end" : "")}>
                                    {!isMe && (
                                       <div className="w-8 h-8 rounded-lg bg-[#ecf4f8] dark:bg-[#1e2532] flex items-center justify-center shrink-0 text-[#3b637b] dark:text-[#5a8cae]">
                                          <UserIcon size={18} />
                                       </div>
                                    )}
                                    <div className={cn(
                                       "p-4 rounded-xl text-[13px] leading-relaxed whitespace-pre-wrap",
                                       isMe 
                                          ? "bg-[#3b637b] dark:bg-[#2e576e] text-white rounded-tr-sm shadow-sm"
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
                              disabled={!activeContact || isPending}
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                              placeholder={activeContact ? `Message ${activeContact.name}...` : "Select a contact..."}
                              className="w-full bg-[#f6f3f4] dark:bg-[#252735] border border-transparent dark:border-white/5 rounded-lg py-2.5 pl-4 pr-14 text-sm text-[#323235] dark:text-[#e2e4f0] placeholder:text-[#b2b1b5] dark:placeholder:text-[#a0a5b5] focus:outline-none focus:ring-2 focus:ring-[#3b637b]/30 shadow-sm disabled:opacity-50"
                           />
                           <button 
                              onClick={handleSend}
                              disabled={!activeContact || isPending || !messageInput.trim()}
                              className="absolute right-2 w-8 h-8 rounded-md bg-[#3b637b] dark:bg-[#2e576e] flex items-center justify-center text-white hover:bg-[#24465a] disabled:opacity-50 transition-colors"
                           >
                              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="translate-x-[-1px] translate-y-[1px]" />}
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Right Sidebar - Contacts */}
                  <div className="w-[300px] shrink-0 flex flex-col h-full bg-transparent">
                     <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                        <h3 className="font-bold text-[11px] tracking-widest uppercase text-[#5f5f62] dark:text-[#a0a5b5]">Inbox Contacts</h3>
                     </div>

                     <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide pb-4">
                        {isLoadingEmployees ? (
                           <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                        ) : inboxContacts.map((contact: any) => (
                           <div 
                              key={contact.id} 
                              onClick={() => setActiveContact(contact)}
                              className={cn(
                                 "bg-white dark:bg-[#1a1b24] rounded-xl p-4 shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5 cursor-pointer transition-colors relative",
                                 activeContact?.id === contact.id ? "ring-2 ring-[#3b637b] dark:ring-[#5a8cae]" : "hover:bg-[#fcf8f9] dark:hover:bg-[#252735]"
                              )}
                           >
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    {contact.name.substring(0, 2).toUpperCase()}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                       <h4 className="font-bold text-[#323235] dark:text-[#e2e4f0] text-[13px] leading-tight truncate">{contact.name}</h4>
                                       {contact.lastMessageTime > 0 && (
                                          <span className="text-[10px] text-[#a0a5b5]">
                                             {new Date(contact.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                       )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <p className="text-[11px] text-[#5f5f62] dark:text-[#a0a5b5] truncate max-w-[160px]">
                                          {contact.lastMessageText || contact.role}
                                       </p>
                                       {contact.messageCount > 0 && (
                                          <span className="bg-[#3b637b] dark:bg-[#5a8cae] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                                             {contact.messageCount}
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
         </div>
      </div>
   );
}

export default function EmployeeChatbotPage() {
  return (
    <ProtectedRoute requiredRole="Employee">
      <EmployeeChatbotContent />
    </ProtectedRoute>
  );
}
