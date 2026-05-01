'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Headphones,
  Clock,
  Moon,
  Sun,
  Cpu,
} from 'lucide-react';
import { cn } from '@user/lib/utils';
import { useUserStore } from '@user/store/userStore';

const navItems = [
  { label: 'Service Desk', href: '/user/support', icon: Headphones },
  { label: 'Ticket History', href: '/user/history', icon: Clock },
];

export function UserSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useUserStore();

  return (
    <aside
      className={cn(
        'w-16 min-h-screen flex flex-col items-center py-4 shrink-0 shadow-lg z-20',
        theme === 'dark'
          ? 'bg-[#1f212a] text-muted-foreground'
          : 'bg-[#353744] text-gray-400'
      )}
    >
      {/* Logo */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex flex-col items-center justify-center text-white font-bold text-sm shadow-md mb-6 cursor-pointer">
        <Cpu size={18} />
      </div>

      {/* App label */}
      <div className="text-[8px] font-bold tracking-widest uppercase text-white/40 mb-5 text-center leading-tight">
        AL<br />V2.4.0
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
              <span className="text-[9px] font-medium leading-none text-center px-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col w-full gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1.5 py-3 w-full transition-colors hover:text-gray-200"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span className="text-[9px] font-medium leading-none">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>
      </div>
    </aside>
  );
}
