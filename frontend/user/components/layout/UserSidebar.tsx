'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Headphones,
  MessageSquare,
  Clock,
  Moon,
  Sun,
  Cpu,
  LogOut,
} from 'lucide-react';
import { cn } from '@user/lib/utils';
import { useUserStore } from '@user/store/userStore';
import { useAuth } from '@app/auth/AuthContext';
import { toast } from 'sonner';

const navItems = [
  { label: 'Dashboard', href: '/user/dashboard', icon: LayoutDashboard },
  { label: 'AI Support', href: '/user/support', icon: Headphones },
  { label: 'Messaging', href: '/user/messaging', icon: MessageSquare },
  { label: 'History', href: '/user/history', icon: Clock },
];

export function UserSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useUserStore();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

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
      <div className="w-8 h-8 rounded-lg bg-primary flex flex-col items-center justify-center text-white font-bold text-sm shadow-md mb-6 cursor-pointer hover:opacity-90 transition-opacity">
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
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
              )}
              <Icon size={20} className={active ? 'text-white' : ''} />
              <span className="text-[9px] font-medium leading-none text-center px-1">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col w-full gap-1">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1.5 py-3 w-full transition-colors hover:text-red-400 text-muted-foreground"
          title="Logout"
        >
          <LogOut size={18} />
          <span className="text-[9px] font-medium leading-none">Logout</span>
        </button>
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
        {/* Profile Avatar */}
        <div className="mt-2 py-2 w-full flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 border-2 border-[#353744] shadow-sm flex items-center justify-center text-white text-[9px] font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </aside>
  );
}
