export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex min-w-0 h-full w-full animate-in fade-in duration-500 ease-in-out">
      {children}
    </div>
  );
}
