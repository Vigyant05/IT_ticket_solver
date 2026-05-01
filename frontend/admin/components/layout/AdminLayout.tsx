export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-w-0 h-full w-full overflow-y-auto bg-background transition-colors">
      <main className="flex-1 overflow-auto relative h-full flex flex-col">
        {children}
      </main>
    </div>
  );
}
