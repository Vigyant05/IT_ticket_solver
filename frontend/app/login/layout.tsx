import type { Metadata } from 'next';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Login | Architectural Ledger',
  description: 'Login portal for Architectural Ledger',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {children}
      <Toaster position="top-center" />
    </div>
  );
}
