'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  BookOpen,
  Video,
  ExternalLink,
  Ticket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployeeStore, Message } from '@/store/employeeStore';
import { toast } from 'sonner';



function ChatMessage({ msg }: { msg: Message }) {
  const isEmployee = msg.role === 'assistant';

  if (isEmployee) {
    return (
      <div className="flex gap-3 max-w-[80%] ml-auto justify-end">
        <div className="bg-[#3b637b] dark:bg-[#2e576e] p-3.5 rounded-xl rounded-tr-sm text-white text-[13px] leading-relaxed shadow-[0px_4px_12px_rgba(59,99,123,0.18)] dark:shadow-[0px_4px_12px_rgba(0,0,0,0.3)]">
          {msg.content}
          <div className="text-[10px] text-white/60 font-semibold tracking-wider uppercase mt-2">
            {msg.timestamp}
          </div>
        </div>
        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-0.5">
          <img src="https://i.pravatar.cc/150?img=11" alt="Employee" className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 max-w-[80%]">
      <div className="w-8 h-8 rounded-lg bg-[#3b637b]/15 dark:bg-[#1e2532] flex items-center justify-center shrink-0 text-[#3b637b] dark:text-[#5a8cae] mt-0.5">
        <img src="https://i.pravatar.cc/150?img=33" alt="User" className="w-full h-full object-cover rounded-lg" />
      </div>
      <div>
        <div className="bg-[#f6f5f5] dark:bg-[#252735] p-3.5 rounded-xl rounded-tl-sm text-[#323235] dark:text-[#e2e4f0] text-[13px] leading-relaxed shadow-sm dark:shadow-none dark:border dark:border-white/5">
          {msg.content}
          <div className="text-[10px] text-[#5f5f62] dark:text-[#a0a5b5] font-semibold tracking-wider uppercase mt-2">
            {msg.timestamp}
          </div>
        </div>
        {msg.actions && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {msg.actions.map((action) => (
              <button
                key={action.label}
                className="px-3 py-1.5 rounded-md text-[11px] font-semibold border border-[#e0dede] dark:border-white/10 text-[#3b637b] dark:text-[#5a8cae] bg-white dark:bg-[#1e1f29] hover:bg-[#f0f4f6] dark:hover:bg-[#252735] transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResolvePage() {
  const { messages, addMessage } = useEmployeeStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendReply = () => {
    const text = input.trim();
    if (!text) {
      toast.error('Please enter a reply.');
      return;
    }

    const employeeMsg: Message = {
      id: `m${Date.now()}`,
      role: 'assistant',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    addMessage(employeeMsg);
    setInput('');

    toast.success(`Reply sent to user!`);

    // Simulate user acknowledgement
    setTimeout(() => {
      const userMsg: Message = {
        id: `m${Date.now() + 1}`,
        role: 'user',
        content: `Thank you, I will try that and let you know if it works.`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      addMessage(userMsg);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8f7f9] dark:bg-[#12131a] text-[#323235] dark:text-[#f5f6fa]">

      {/* ── Main content ────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">

          {/* Page Title */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-[32px] font-manrope font-bold text-[#1e2a35] dark:text-[#e8edf5] leading-tight tracking-tight">
              Ticket Resolution
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-semibold text-[#5f5f62] dark:text-[#a0a5b5]">Current Ticket:</span>
              <span className="bg-[#e8f1f5] dark:bg-[#1e2532] text-[#3b637b] dark:text-[#5a8cae] px-3 py-1.5 rounded-lg text-[13px] font-bold font-mono">TKT-4821</span>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="flex gap-5 min-h-0">

            {/* ── Chat Panel ────────────────────────── */}
            <div
              className="flex-1 flex flex-col bg-white dark:bg-[#1a1b24] rounded-xl shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5 overflow-hidden min-h-0"
              style={{ maxHeight: '500px' }}
            >
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} msg={msg} />
                ))}
              </div>

              {/* Input */}
              <div className="px-4 py-3.5 border-t border-[#f0eff0] dark:border-white/5 bg-[#faf9fa] dark:bg-[#12131a]/60 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Type your reply to the user..."
                    className="flex-1 bg-[#f6f3f4] dark:bg-[#252735] rounded-lg px-4 py-2 text-[13px] text-[#323235] dark:text-[#e2e4f0] placeholder:text-[#b2b1b5] dark:placeholder:text-[#a0a5b5] border border-transparent dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-[#3b637b]/30"
                  />
                  <button
                    onClick={handleSendReply}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b637b] dark:bg-[#2e576e] hover:bg-[#2e576e] dark:hover:bg-[#24465a] text-white text-[12px] font-bold transition-colors shadow-sm shrink-0"
                  >
                    <Bot size={14} />
                    Send Reply
                  </button>
                </div>
              </div>
            </div>

            {/* ── Guides ─────────────────────────────── */}
            <div
              className="w-[260px] shrink-0 flex flex-col gap-4"
              style={{ maxHeight: '500px', overflowY: 'auto' }}
            >
              {/* Personal Resolution Guide */}
              <div className="bg-white dark:bg-[#1a1b24] rounded-xl p-5 shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5 flex flex-col items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#ecf4f8] dark:bg-[#1e2532] flex items-center justify-center text-[#3b637b] dark:text-[#5a8cae] shrink-0">
                  <BookOpen size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-bold text-[#3b637b] dark:text-[#5a8cae] mb-1">
                    Personal Resolution Guide
                  </h4>
                  <p className="text-[12px] text-[#5f5f62] dark:text-[#a0a5b5] leading-relaxed mb-2.5">
                    Detailed architectural explanations and system requirements for common tickets.
                  </p>
                  <button className="text-[11px] font-bold tracking-wider text-[#3b637b] dark:text-[#5a8cae] hover:underline flex items-center gap-1 uppercase">
                    Download PDF Reference
                    <ExternalLink size={11} />
                  </button>
                </div>
              </div>

              {/* Video Guide */}
              <div className="bg-white dark:bg-[#1a1b24] rounded-xl p-5 shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5 flex flex-col items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#ecf4f8] dark:bg-[#1e2532] flex items-center justify-center text-[#3b637b] dark:text-[#5a8cae] shrink-0">
                  <Video size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-bold text-[#3b637b] dark:text-[#5a8cae] mb-1">
                    Video Guide
                  </h4>
                  <p className="text-[12px] text-[#5f5f62] dark:text-[#a0a5b5] leading-relaxed mb-2.5">
                    Visual walkthroughs for common Ledger tasks and node configurations.
                  </p>
                  <button className="text-[11px] font-bold tracking-wider text-[#3b637b] dark:text-[#5a8cae] hover:underline flex items-center gap-1 uppercase">
                    Watch Library Sessions
                    <ExternalLink size={11} />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
