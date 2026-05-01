'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Users,
  Moon,
  Sun,
  Cpu,
} from 'lucide-react';
import { cn } from '@admin/lib/utils';
import { useTicketStore } from '@admin/store/ticketStore';

const navItems = [
  { label: 'Tickets', href: '/admin/tickets', icon: LayoutDashboard },
  { label: 'Chatbot', href: '/admin/chatbot', icon: MessageSquare },
  { label: 'Insights', href: '/admin/insights', icon: BarChart3 },
  { label: 'Employees', href: '/admin/employees', icon: Users },
];


export function PrimarySidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTicketStore();

  return (
    <aside className={cn(
      "w-16 min-h-screen flex flex-col items-center py-4 shrink-0 shadow-lg z-20",
      theme === 'dark' ? "bg-[#1f212a] text-muted-foreground" : "bg-[#353744] text-gray-400"
    )}>
      {/* Logo */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex flex-col items-center justify-center text-white font-bold text-sm shadow-md mb-6 cursor-pointer">
        <Cpu size={18} />
      </div>

      {/* Main Nav */}
      <nav className="flex flex-col w-full gap-2">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1.5 py-3 w-full transition-colors relative',
                active
                  ? 'text-white bg-white/5'
                  : 'hover:text-gray-200'
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
              )}
              <Icon size={20} className={active ? 'text-white' : ''} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col w-full gap-2">
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1.5 py-3 w-full transition-colors hover:text-gray-200"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span className="text-[10px] font-medium leading-none">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>
        {/* Profile Avatar Placeholder */}
        <div className="mt-2 py-3 w-full flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 border-2 border-[#353744] shadow-sm flex items-center justify-center text-white text-[10px] font-bold">
            IT
          </div>
        </div>
      </div>
    </aside>
  );
}
