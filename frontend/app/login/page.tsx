'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@login/lib/utils';
import { User, Shield, Briefcase, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@app/auth/AuthContext';

type Role = 'User' | 'Employee' | 'Admin';

const roles: { id: Role; icon: React.ElementType; label: string }[] = [
  { id: 'User', icon: User, label: 'User' },
  { id: 'Employee', icon: Briefcase, label: 'Employee' },
  { id: 'Admin', icon: Shield, label: 'Admin' },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('User');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both Email and Password');
      return;
    }

    setIsLoading(true);
    const success = await login(email, password, selectedRole);

    if (success) {
      // Redirect based on role
      if (selectedRole === 'Admin') {
        router.push('/admin/tickets');
      } else if (selectedRole === 'Employee') {
        router.push('/employees/resolve');
      } else {
        router.push('/user/support');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-zinc-900 selection:bg-zinc-100 font-sans">
      <div className="w-full max-w-md px-8 py-12 flex flex-col items-center">
        {/* Logo + App Name */}
        <div className="flex flex-col items-center gap-3 mb-12">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
            <Image src="/logo.png" alt="HALO Support" width={64} height={64} className="object-contain w-full h-full" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center text-[#1e2a35]" style={{ fontFamily: 'var(--font-outfit, sans-serif)' }}>
            HALO Support
          </h1>
          <p className="text-sm text-[#8a8a8c] tracking-wide">Helpdesk Automation and Logic Operations</p>
        </div>

        {/* Role Selection */}
        <div className="w-full mb-10">
          <p className="text-sm font-semibold text-[#5f5f62] mb-4 text-center uppercase tracking-widest">
            Login As
          </p>
          <div className="grid grid-cols-3 gap-3">
            {roles.map((role) => {
              const isSelected = selectedRole === role.id;
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl border transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
                    isSelected
                      ? 'border-[#25283d] bg-[#25283d] text-white shadow-[0_8px_30px_rgba(34,35,43,0.3)] scale-105 z-10'
                      : 'border-zinc-200 bg-white text-[#5f5f62] hover:border-zinc-300 hover:bg-zinc-50 scale-100 hover:scale-[1.02]'
                  )}
                >
                  <Icon size={20} strokeWidth={isSelected ? 2.5 : 2} />
                  <span className="text-[11px] font-bold tracking-wide uppercase">
                    {role.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#22232b] uppercase tracking-wider ml-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-sm text-[#1e2a35] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#22232b]/40 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#22232b] uppercase tracking-wider ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-sm text-[#1e2a35] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#22232b]/40 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#22232b] text-white text-[13px] font-bold uppercase tracking-wider hover:bg-[#1a1b22] transition-colors shadow-lg shadow-[#22232b]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
            {!isLoading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-zinc-400">
            Default password: 12345
          </p>
        </div>
      </div>
    </div>
  );
}
