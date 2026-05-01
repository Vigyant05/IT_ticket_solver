'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Video,
  ExternalLink,
  Ticket,
  HelpCircle,
  Mic,
} from 'lucide-react';
import { cn } from '@user/lib/utils';
import { useUserStore, Message } from '@user/store/userStore';
import { toast } from 'sonner';

// ── Frequent Solutions accordion data ──────────────────────────────────────
const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'Password Reset / Login Issues',
    bullets: [
      'Verify user identity (security questions / OTP)',
      'Reset password via Active Directory / system admin panel',
      'Unlock account if locked',
      'Advise strong password creation (mix of symbols, numbers)',
    ],
  },
  {
    id: 'faq-2',
    question: 'Slow Computer Performance',
    bullets: [
      'Check CPU/RAM usage via Task Manager',
      'Disable unnecessary startup programs',
      'Run antivirus scan',
      'Clear temporary files / cache',
      'Upgrade RAM or SSD if needed',
    ],
  },
  {
    id: 'faq-3',
    question: 'Internet / Network Connectivity Issues',
    bullets: [
      'Restart router/modem',
      'Check IP configuration (ipconfig /renew)',
      'Verify cables/Wi-Fi connection',
      'Reset network settings',
      'Contact ISP if outage detected',
    ],
  },
  {
    id: 'faq-4',
    question: 'Printer Not Working',
    bullets: [
      'Check printer power and connection',
      'Restart print spooler service',
      'Reinstall/update printer drivers',
      'Set printer as default',
      'Clear print queue',
    ],
  },
  {
    id: 'faq-5',
    question: 'Software Installation / Update Failure',
    bullets: [
      'Check system requirements',
      'Run installer as administrator',
      'Disable antivirus temporarily',
      'Ensure sufficient disk space',
      'Reinstall or download latest version',
    ],
  },
  {
    id: 'faq-6',
    question: 'Email Issues (Not Sending/Receiving)',
    bullets: [
      'Check internet connection',
      'Verify SMTP/IMAP settings',
      'Clear mailbox storage if full',
      'Reconfigure email account',
      'Restart email client (e.g., Outlook)',
    ],
  },
  {
    id: 'faq-7',
    question: 'Blue Screen / System Crash',
    bullets: [
      'Note error code for diagnosis',
      'Update drivers and OS',
      'Run system diagnostics (RAM, disk)',
      'Boot in Safe Mode',
      'Restore system or reinstall OS if needed',
    ],
  },
];

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof FAQ_ITEMS)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[#f0eff0] dark:border-white/5 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3.5 text-left group"
      >
        <span className="text-[13px] font-medium text-[#323235] dark:text-[#e2e4f0] group-hover:text-[#3b637b] dark:group-hover:text-[#5a8cae] transition-colors leading-snug pr-2">
          {item.question}
        </span>
        {isOpen ? (
          <ChevronUp size={15} className="text-[#5f5f62] dark:text-[#a0a5b5] shrink-0" />
        ) : (
          <ChevronDown size={15} className="text-[#5f5f62] dark:text-[#a0a5b5] shrink-0" />
        )}
      </button>
      {isOpen && item.bullets && (
        <div className="pb-4 animate-accordion-down overflow-hidden">
          <ul className="space-y-1.5">
            {item.bullets.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-[#5f5f62] dark:text-[#a0a5b5] leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3b637b] dark:bg-[#5a8cae] shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex gap-3 max-w-[80%] ml-auto justify-end">
        <div className="bg-[#3b637b] dark:bg-[#2e576e] p-3.5 rounded-xl rounded-tr-sm text-white text-[13px] leading-relaxed shadow-[0px_4px_12px_rgba(59,99,123,0.18)] dark:shadow-[0px_4px_12px_rgba(0,0,0,0.3)]">
          {msg.content}
          <div className="text-[10px] text-white/60 font-semibold tracking-wider uppercase mt-2">
            {msg.timestamp}
          </div>
        </div>
        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-0.5">
          <img src="https://i.pravatar.cc/150?img=33" alt="You" className="w-full h-full object-cover" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 max-w-[80%]">
      <div className="w-8 h-8 rounded-lg bg-[#3b637b]/15 dark:bg-[#1e2532] flex items-center justify-center shrink-0 text-[#3b637b] dark:text-[#5a8cae] mt-0.5">
        <Bot size={16} />
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

export default function SupportPage() {
  const { messages, addMessage } = useUserStore();
  const [input, setInput] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>('faq-2');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleRaiseTicket = () => {
    const text = input.trim();
    if (!text) {
      toast.error('Please describe your issue first.');
      return;
    }

    const userMsg: Message = {
      id: `m${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    addMessage(userMsg);
    setInput('');

    const ticketId = 'TKT-' + Math.floor(4900 + Math.random() * 100);
    toast.success(`Ticket ${ticketId} raised successfully!`, {
      description: 'Our team will get back to you shortly.',
    });

    // Simulate AI acknowledgement
    setTimeout(() => {
      const aiMsg: Message = {
        id: `m${Date.now() + 1}`,
        role: 'assistant',
        content: `Your ticket (${ticketId}) has been raised. I'm analyzing your request and will provide a detailed response shortly. In the meantime, you may want to check our Frequent Solutions panel.`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { label: 'View Ticket', variant: 'primary' },
          { label: 'View Solutions', variant: 'secondary' },
        ],
      };
      addMessage(aiMsg);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8f7f9] dark:bg-[#12131a] text-[#323235] dark:text-[#f5f6fa]">

      {/* ── Main content ────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">

          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-[32px] font-manrope font-bold text-[#1e2a35] dark:text-[#e8edf5] leading-tight tracking-tight">
              IT Ticket Resolver
            </h1>
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
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0f4f6] dark:hover:bg-white/5 text-[#a0a5b5] transition-colors">
                    <Mic size={16} />
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRaiseTicket()}
                    placeholder="Type your issue here..."
                    className="flex-1 bg-[#f6f3f4] dark:bg-[#252735] rounded-lg px-4 py-2 text-[13px] text-[#323235] dark:text-[#e2e4f0] placeholder:text-[#b2b1b5] dark:placeholder:text-[#a0a5b5] border border-transparent dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-[#3b637b]/30"
                  />
                  <button
                    onClick={handleRaiseTicket}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b637b] dark:bg-[#2e576e] hover:bg-[#2e576e] dark:hover:bg-[#24465a] text-white text-[12px] font-bold transition-colors shadow-sm shrink-0"
                  >
                    <Ticket size={14} />
                    Raise Ticket
                  </button>
                </div>
              </div>
            </div>

            {/* ── Frequent Solutions ─────────────────── */}
            <div
              className="w-[260px] shrink-0 bg-white dark:bg-[#1a1b24] rounded-xl shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5 p-5"
              style={{ maxHeight: '500px', overflowY: 'auto' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-bold text-[#323235] dark:text-[#e2e4f0]">
                  Frequent Solutions
                </h3>
                <button className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#f6f3f4] dark:hover:bg-white/5">
                  <HelpCircle size={14} className="text-[#a0a5b5]" />
                </button>
              </div>

              <div>
                {FAQ_ITEMS.map((item) => (
                  <AccordionItem
                    key={item.id}
                    item={item}
                    isOpen={openFaq === item.id}
                    onToggle={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Resource Cards ─────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {/* Technical Specs */}
            <div className="bg-white dark:bg-[#1a1b24] rounded-xl p-5 shadow-[0px_4px_24px_rgba(13,60,82,0.05)] dark:shadow-none dark:border dark:border-white/5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#ecf4f8] dark:bg-[#1e2532] flex items-center justify-center text-[#3b637b] dark:text-[#5a8cae] shrink-0">
                <BookOpen size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-bold text-[#3b637b] dark:text-[#5a8cae] mb-1">
                  Technical Specs
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

            {/* Video Tutorials */}
            <div className="bg-white dark:bg-[#1a1b24] rounded-xl p-5 shadow-[0px_4px_24px_rgba(13,60,82,0.05)] dark:shadow-none dark:border dark:border-white/5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#ecf4f8] dark:bg-[#1e2532] flex items-center justify-center text-[#3b637b] dark:text-[#5a8cae] shrink-0">
                <Video size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-bold text-[#3b637b] dark:text-[#5a8cae] mb-1">
                  Video Tutorials
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
  );
}
