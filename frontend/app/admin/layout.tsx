import type { Metadata } from 'next';
import { QueryProvider } from '@admin/components/providers/QueryProvider';
import { Toaster } from 'sonner';
import { ThemeScript } from './theme-script';

export const metadata: Metadata = {
  title: 'IT Resolver | Architectural Ledger',
  description:
    'Minimal IT Ticket Resolution System — powered by RAG-based AI routing with FAQ, Action Path, and Complex Path resolution.',
  keywords: ['IT tickets', 'helpdesk', 'support', 'AI resolver', 'ticket management'],
  authors: [{ name: 'IT Resolver Team' }],
  openGraph: {
    title: 'IT Resolver | Architectural Ledger',
    description: 'AI-powered IT Ticket Resolution System',
    type: 'website',
  },
};

import { PrimarySidebar } from '@admin/components/layout/PrimarySidebar';
import { ThemeController } from '@admin/components/layout/ThemeController';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeScript />
      <QueryProvider>
        <ThemeController />
        <div className="flex h-screen bg-background overflow-hidden relative w-full">
          <PrimarySidebar />
          {children}
        </div>
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            classNames: {
              toast: 'font-sans text-sm',
            },
          }}
        />
      </QueryProvider>
    </>
  );
}
