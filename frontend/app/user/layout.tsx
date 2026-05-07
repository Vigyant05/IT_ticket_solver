import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { ThemeScript } from './theme-script';
import { UserSidebar } from '@user/components/layout/UserSidebar';
import { ThemeController } from '@user/components/layout/ThemeController';
import { QueryProvider } from '@admin/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Support Center | Architectural Ledger',
  description:
    'User Support Portal — Report issues, track tickets, and get AI-powered assistance for your Architectural Ledger.',
  keywords: ['support', 'helpdesk', 'tickets', 'AI assistant', 'ledger'],
  authors: [{ name: 'Architectural Ledger Support' }],
  openGraph: {
    title: 'Support Center | Architectural Ledger',
    description: 'AI-powered User Support Portal',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeScript />
      <QueryProvider>
        <ThemeController />
        <div className="flex h-screen bg-[#f8f7f9] dark:bg-[#0b0c10] text-[#323235] dark:text-[#e2e4f0] font-inter overflow-hidden transition-colors duration-300">
          {/* Sidebar Navigation */}
          <UserSidebar />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {children}
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              'bg-white dark:bg-[#1a1b24] border border-[#eeecee] dark:border-white/5 text-[#323235] dark:text-[#e2e4f0] shadow-xl dark:shadow-none',
          }}
        />
      </QueryProvider>
    </>
  );
}
