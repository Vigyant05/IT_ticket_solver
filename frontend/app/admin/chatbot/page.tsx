import { Search, Bell, Settings, Send, Paperclip, Database, User } from 'lucide-react';
import { Bot } from 'lucide-react';

export default function ChatbotPage() {
   return (
      <div className="min-h-screen bg-[#fcf8f9] dark:bg-[#12131a] text-[#323235] dark:text-[#f5f6fa] p-4 lg:p-8 font-sans flex flex-col h-screen overflow-hidden">
         {/* Top Bar */}
         <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="relative w-[28rem] max-w-full">
               <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f5f62] dark:text-[#a0a5b5]" />
               <input
                  type="text"
                  placeholder="Search commands..."
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
            <h1 className="text-2xl font-manrope font-bold text-[#172229] dark:text-[#5a8cae] mb-1.5 leading-tight">
               Chat with AI Assistant
            </h1>
            <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-sm max-w-3xl leading-relaxed">
               Solve complex technical queries or automate directory workflows using the Architectural Ledger's neural processing unit.
            </p>
         </div>

         {/* Main Content Area */}
         <div className="flex gap-6 flex-1 min-h-0">

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col bg-[#ffffff] dark:bg-[#1a1b24] rounded-xl shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 overflow-hidden">

               {/* Output Area */}
               <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">

                  {/* System Message */}
                  <div className="flex gap-4 max-w-[85%]">
                     <div className="w-8 h-8 rounded-lg bg-[#ecf4f8] dark:bg-[#1e2532] flex items-center justify-center shrink-0 text-[#172229] dark:text-[#5a8cae]">
                        <Bot size={18} />
                     </div>
                     <div className="bg-[#f6f3f4] dark:bg-[#252735] p-4 rounded-xl rounded-tl-sm text-[#323235] dark:text-[#f5f6fa] text-[13px] leading-relaxed shadow-sm dark:shadow-none dark:border dark:border-white/5">
                        Greetings, Admin. I've analyzed the system logs for the past 24 hours. No critical outages detected. How can I assist you with the Architectural Ledger today?
                        <div className="text-[10px] text-[#5f5f62] dark:text-[#a0a5b5] font-semibold tracking-wider uppercase mt-2">
                           10:42 AM • AI Assistant
                        </div>
                     </div>
                  </div>

                  {/* User Message */}
                  <div className="flex gap-4 max-w-[85%] ml-auto justify-end">
                     <div className="bg-[#172229] p-4 rounded-xl rounded-tr-sm text-[#ffffff] text-[13px] leading-relaxed shadow-[0px_4px_12px_rgba(59,99,123,0.15)] dark:shadow-[0px_4px_12px_rgba(0,0,0,0.3)]">
                        Generate a list of employees in the engineering department who have open tickets pending for more than 48 hours.
                        <div className="text-[10px] text-white/70 font-semibold tracking-wider uppercase mt-2">
                           10:45 AM • ADMIN
                        </div>
                     </div>
                     <div className="w-8 h-8 rounded-lg bg-[#e3ecf1] dark:bg-[#2d3a4a] flex items-center justify-center shrink-0 text-[#172229] dark:text-[#7bb0d6]">
                        <User size={18} />
                     </div>
                  </div>

                  {/* System Message with Data */}
                  <div className="flex gap-4 max-w-[85%]">
                     <div className="w-8 h-8 rounded-lg bg-[#ecf4f8] dark:bg-[#1e2532] flex items-center justify-center shrink-0 text-[#172229] dark:text-[#5a8cae]">
                        <Bot size={18} />
                     </div>
                     <div className="bg-[#f6f3f4] dark:bg-[#252735] p-4 lg:p-5 rounded-xl rounded-tl-sm text-[#323235] dark:text-[#f5f6fa] text-[13px] leading-relaxed shadow-sm dark:shadow-none dark:border dark:border-white/5 w-full">
                        Processing your request... I've identified 3 engineers with overdue tickets. You can see their summary below or contact them directly from the sidebar.

                        <div className="mt-4 bg-white dark:bg-[#1e1f29] rounded-lg p-3 flex flex-col gap-2.5 shadow-sm dark:shadow-none dark:border dark:border-white/5">
                           <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-[#323235] dark:text-[#e2e4f0]">Sarah Jenkins</span>
                              <span className="text-[#752121] dark:text-[#ff8a8a]">52h Pending</span>
                           </div>
                           <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-[#323235] dark:text-[#e2e4f0]">Marcus Zhao</span>
                              <span className="text-[#752121] dark:text-[#ff8a8a]">71h Pending</span>
                           </div>
                        </div>
                     </div>
                  </div>

               </div>

               {/* Input Area */}
               <div className="p-5 bg-[#fcf8f9]/50 dark:bg-[#12131a]/50 border-t border-[#f6f3f4] dark:border-white/5">
                  <div className="relative flex items-center">
                     <input
                        type="text"
                        placeholder="Type your command or query here..."
                        className="w-full bg-[#ffffff] dark:bg-[#252735] border border-[#f6f3f4] dark:border-white/5 rounded-lg py-2.5 pl-4 pr-14 text-sm text-[#323235] dark:text-[#f5f6fa] placeholder:text-[#b2b1b5] dark:placeholder:text-[#a0a5b5] focus:outline-none focus:ring-2 focus:ring-[#172229]/30 shadow-sm"
                     />
                     <button className="absolute right-2 w-8 h-8 rounded-md bg-[#172229] dark:bg-[#5a8cae] flex items-center justify-center text-white hover:bg-[#2e576e] dark:hover:bg-[#467393]">
                        <Send size={16} className="translate-x-[-1px] translate-y-[1px]" />
                     </button>
                  </div>
                  <div className="flex gap-5 mt-3 pl-2 text-xs text-[#5f5f62] dark:text-[#a0a5b5] font-semibold">
                     <button className="flex items-center gap-1.5 hover:text-[#172229] dark:hover:text-[#ffffff]">
                        <Paperclip size={14} /> Upload Log
                     </button>
                     <button className="flex items-center gap-1.5 hover:text-[#172229] dark:hover:text-[#ffffff]">
                        <Database size={14} /> Query DB
                     </button>
                  </div>
               </div>

            </div>

            {/* Right Sidebar - Active Contacts */}
            <div className="w-[300px] shrink-0 flex flex-col h-full bg-transparent">
               <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                  <h3 className="font-bold text-[10px] tracking-widest uppercase text-[#5f5f62] dark:text-[#a0a5b5]">Active Contacts</h3>
                  <button className="text-[10px] font-bold tracking-widest uppercase text-[#172229] dark:text-[#5a8cae] hover:text-[#2e576e] dark:hover:text-[#7bb0d6]">View All</button>
               </div>

               <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide pb-4">
                  {/* Contact Card 1 */}
                  <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-4 shadow-[0px_4px_16px_rgba(13,60,82,0.03)] dark:shadow-none dark:border dark:border-white/5">
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                              <img src="https://i.pravatar.cc/150?img=5" alt="Sarah" className="w-full h-full object-cover" />
                           </div>
                           <div>
                              <h4 className="font-semibold text-[#323235] dark:text-[#f5f6fa] text-[13px] leading-tight">Sarah Jenkins</h4>
                              <p className="text-[10px] text-[#5f5f62] dark:text-[#a0a5b5] tra  cking-wider mt-0.5">ID: ENG-4492</p>
                           </div>
                        </div>
                        <span className="bg-[#fe8983]/20 dark:bg-[#fe8983]/10 text-[#752121] dark:text-[#fe8983] text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                           Overdue
                        </span>
                     </div>
                     <div className="flex gap-2">
                        <button className="flex-1 bg-[#172229] dark:bg-[#467393] hover:bg-[#2e576e] dark:hover:bg-[#5a8cae] text-white py-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5">
                           <Send size={12} /> Text
                        </button>
                        <button className="flex-1 bg-[#f6f3f4] dark:bg-[#1e1f29] hover:bg-[#eceae8] dark:hover:bg-[#12131a] text-[#323235] dark:text-[#e2e4f0] py-1.5 rounded-md text-[11px] font-semibold shrink-0 border border-transparent dark:border-white/5">
                           Mail
                        </button>
                     </div>
                  </div>

                  {/* Contact Card 2 */}
                  <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-4 shadow-[0px_4px_16px_rgba(13,60,82,0.03)] dark:shadow-none dark:border dark:border-white/5">
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                              <img src="https://i.pravatar.cc/150?img=11" alt="Marcus" className="w-full h-full object-cover" />
                           </div>
                           <div>
                              <h4 className="font-semibold text-[#323235] dark:text-[#f5f6fa] text-[13px] leading-tight">Marcus Zhao</h4>
                              <p className="text-[10px] text-[#5f5f62] dark:text-[#a0a5b5] tracking-wider mt-0.5">ID: ENG-3120</p>
                           </div>
                        </div>
                        <span className="bg-[#fe8983]/20 dark:bg-[#fe8983]/10 text-[#752121] dark:text-[#fe8983] text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                           Overdue
                        </span>
                     </div>
                     <div className="flex gap-2">
                        <button className="flex-1 bg-[#172229] dark:bg-[#467393] hover:bg-[#2e576e] dark:hover:bg-[#5a8cae] text-white py-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5">
                           <Send size={12} /> Text
                        </button>
                        <button className="flex-1 bg-[#f6f3f4] dark:bg-[#1e1f29] hover:bg-[#eceae8] dark:hover:bg-[#12131a] text-[#323235] dark:text-[#e2e4f0] py-1.5 rounded-md text-[11px] font-semibold shrink-0 border border-transparent dark:border-white/5">
                           Call
                        </button>
                     </div>
                  </div>

                  {/* Contact Card 3 */}
                  <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-4 shadow-[0px_4px_16px_rgba(13,60,82,0.03)] dark:shadow-none dark:border dark:border-white/5">
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                              <img src="https://i.pravatar.cc/150?img=9" alt="Elena" className="w-full h-full object-cover" />
                           </div>
                           <div>
                              <h4 className="font-semibold text-[#323235] dark:text-[#f5f6fa] text-[13px] leading-tight">Elena Rodriguez</h4>
                              <p className="text-[10px] text-[#5f5f62] dark:text-[#a0a5b5] tracking-wider mt-0.5">ID: PM-8821</p>
                           </div>
                        </div>
                        <span className="bg-[#e3f2fd] dark:bg-[#1976d2]/20 text-[#1976d2] dark:text-[#64b5f6] text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm">
                           Active
                        </span>
                     </div>
                     <div className="flex gap-2">
                        <button className="flex-1 bg-[#172229] dark:bg-[#467393] hover:bg-[#2e576e] dark:hover:bg-[#5a8cae] text-white py-1.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5">
                           <Send size={12} /> Text
                        </button>
                        <button className="flex-1 bg-[#f6f3f4] dark:bg-[#1e1f29] hover:bg-[#eceae8] dark:hover:bg-[#12131a] text-[#323235] dark:text-[#e2e4f0] py-1.5 rounded-md text-[11px] font-semibold shrink-0 border border-transparent dark:border-white/5">
                           Call
                        </button>
                     </div>
                  </div>

               </div>
            </div>
         </div>
      </div>
   );
}
