'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Headphones,
  Clock,
  Moon,
  Sun,
  Ticket,
  User,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@employees/lib/utils';
import { useEmployeeStore } from '@employees/store/employeeStore';
import { useAuth } from '@app/auth/AuthContext';
import { toast } from 'sonner';

const navItems = [
  { label: 'Dashboard', href: '/employees/dashboard', icon: LayoutDashboard },
  { label: 'Messaging', href: '/employees/chatbot', icon: MessageSquare },
  { label: 'Resolve', href: '/employees/resolve', icon: Headphones },
  { label: 'History', href: '/employees/history', icon: Clock },
];

export function EmployeeSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useEmployeeStore();
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
      <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center mb-1 cursor-pointer hover:opacity-90 transition-opacity shrink-0">
        <Image src="/logo.png" alt="HALO Support" width={48} height={48} className="object-contain" />
      </div>

      {/* App Name */}
      <div className="text-[9px] font-bold tracking-widest uppercase text-white/60 mb-5 text-center leading-tight" style={{ fontFamily: 'var(--font-outfit, sans-serif)' }}>
        HALO<br />Support
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
        {/* Profile */}
        <Link
          href="/employees/profile"
          className={cn(
            'flex flex-col items-center gap-1.5 py-3 w-full transition-colors relative',
            pathname === '/employees/profile' || pathname.startsWith('/employees/profile/')
              ? 'text-white bg-white/5'
              : 'hover:text-gray-200'
          )}
          title="Employee Profile"
        >
          {(pathname === '/employees/profile' || pathname.startsWith('/employees/profile/')) && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
          )}
          <User size={18} className={pathname === '/employees/profile' ? 'text-white' : ''} />
          <span className="text-[9px] font-medium leading-none text-center px-1">Profile</span>
        </Link>

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
        <div className="mt-1 py-2 w-full flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 border-2 border-[#353744] shadow-sm flex items-center justify-center text-white text-[9px] font-bold">
            {user?.name?.charAt(0) || 'E'}
          </div>
        </div>
      </div>
    </aside>
  );
}
