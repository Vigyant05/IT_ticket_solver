'use client';

import { SecondarySidebar } from '@admin/components/layout/SecondarySidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SecondarySidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 overflow-auto p-6 relative">
          {children}
        </main>
        {/* Footer */}
        <footer className="px-6 py-3 border-t border-border/30 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
            ——— Architectural Ledger v2.4
          </p>
          <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
            San Francisco • London
          </p>
        </footer>
      </div>
    </>
  );
}
