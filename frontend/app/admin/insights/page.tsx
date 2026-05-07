'use client';

import { useEffect, useState } from 'react';
import { Search, Activity, Ticket, Clock, CheckCircle2, Users } from 'lucide-react';
import { ProtectedRoute } from '@app/auth/ProtectedRoute';
import { fetchAdminStats, fetchAllTickets, fetchAllEmployees } from '@lib/api';

interface Stats {
  total_tickets: number;
  open_tickets: number;
  in_progress: number;
  resolved: number;
  total_employees: number;
}

interface CategoryBreakdown {
  [key: string]: number;
}

function InsightsContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown>({});
  const [teamBreakdown, setTeamBreakdown] = useState<{ team: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, ticketsData, employeesData] = await Promise.all([
          fetchAdminStats(),
          fetchAllTickets(),
          fetchAllEmployees(),
        ]);
        setStats(statsData);

        // Build category breakdown from tickets
        const cats: CategoryBreakdown = {};
        ticketsData.forEach((t: any) => {
          const cat = t.category || 'Uncategorized';
          cats[cat] = (cats[cat] || 0) + 1;
        });
        setCategoryBreakdown(cats);

        // Build team breakdown from employees
        const teams: Record<string, number> = {};
        employeesData.forEach((e: any) => {
          const team = e.team || 'Unassigned';
          teams[team] = (teams[team] || 0) + 1;
        });
        setTeamBreakdown(Object.entries(teams).map(([team, count]) => ({ team, count })).sort((a, b) => b.count - a.count));
      } catch (error) {
        console.error('Failed to load insights', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalTickets = stats?.total_tickets || 0;
  const resolved = stats?.resolved || 0;
  const resolutionRate = totalTickets > 0 ? Math.round((resolved / totalTickets) * 100) : 0;

  // Get top category
  const topCategory = Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a)[0];
  const topCatPercent = topCategory && totalTickets > 0 ? Math.round((topCategory[1] / totalTickets) * 100) : 0;

  const categoryColors = ['#3b637b', '#5a8cae', '#7bb0d6', '#b2b1b5', '#d4d3d7'];

  return (
    <div className="min-h-screen bg-[#fcf8f9] dark:bg-[#12131a] text-[#323235] dark:text-[#f5f6fa] p-4 lg:p-8 font-sans">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[#3b637b] dark:text-[#5a8cae] mb-2">
          <Activity size={14} />
          <span className="text-xs font-semibold tracking-wide">System Intelligence Dashboard</span>
        </div>
        <h1 className="text-2xl leading-tight font-manrope font-bold text-[#323235] dark:text-[#ffffff] mb-1.5">
          Performance Insights
        </h1>
        <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-sm max-w-2xl leading-relaxed">
          Real-time resolution analytics from the IT Ticket Solver database.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#3b637b]/30 border-t-[#3b637b] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Card 1 */}
            <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-5 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-5">
                <div className="w-10 h-10 bg-[#f6f3f4] dark:bg-[#1e1f29] rounded-lg flex items-center justify-center text-[#3b637b] dark:text-[#5a8cae]">
                  <Ticket size={20} strokeWidth={1.5} />
                </div>
              </div>
              <div>
                <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs font-medium mb-1">Total Tickets</p>
                <p className="font-manrope text-3xl font-bold text-[#323235] dark:text-[#ffffff] tracking-tight">{totalTickets}</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-5 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-5">
                <div className="w-10 h-10 bg-[#fcf8f9] dark:bg-[#1e1f29] border border-[#f6f3f4] dark:border-transparent rounded-lg flex items-center justify-center text-[#3b637b] dark:text-[#5a8cae]">
                  <CheckCircle2 size={20} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 bg-[#f6f3f4] dark:bg-[#1e1f29] text-[#5f5f62] dark:text-[#a0a5b5] rounded-full">
                  {resolutionRate > 50 ? 'Good' : 'Needs Attention'}
                </span>
              </div>
              <div>
                <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs font-medium mb-1">Resolution Rate</p>
                <div className="flex items-end gap-3">
                   <p className="font-manrope text-3xl font-bold text-[#323235] dark:text-[#ffffff] tracking-tight">{resolutionRate}%</p>
                   <div className="w-12 h-1 bg-[#3b637b] dark:bg-[#5a8cae] rounded-full mb-2"></div>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-5 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-5">
                <div className="w-10 h-10 bg-[#f6f3f4] dark:bg-[#1e1f29] rounded-lg flex items-center justify-center text-[#3b637b] dark:text-[#5a8cae]">
                  <Clock size={20} strokeWidth={1.5} />
                </div>
              </div>
              <div>
                <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs font-medium mb-1">Open / In Progress</p>
                <p className="font-manrope text-3xl font-bold text-[#323235] dark:text-[#ffffff] tracking-tight">
                  {(stats?.open_tickets || 0)} / {(stats?.in_progress || 0)}
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-5 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-5">
                <div className="w-10 h-10 bg-[#f6f3f4] dark:bg-[#1e1f29] rounded-lg flex items-center justify-center text-[#3b637b] dark:text-[#5a8cae]">
                  <Users size={20} strokeWidth={1.5} />
                </div>
              </div>
              <div>
                <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs font-medium mb-1">Active Employees</p>
                <p className="font-manrope text-3xl font-bold text-[#323235] dark:text-[#ffffff] tracking-tight">{stats?.total_employees || 0}</p>
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Distribution */}
            <div className="lg:col-span-2 bg-[#ffffff] dark:bg-[#252735] rounded-xl p-6 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5">
              <div className="mb-6">
                <h3 className="font-manrope text-lg font-bold text-[#323235] dark:text-[#ffffff] mb-0.5">Team Distribution</h3>
                <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs">Employee count by team</p>
              </div>

              <div className="space-y-4">
                {teamBreakdown.map((item, idx) => {
                  const totalEmps = teamBreakdown.reduce((s, t) => s + t.count, 0);
                  const pct = totalEmps > 0 ? Math.round((item.count / totalEmps) * 100) : 0;
                  return (
                    <div key={item.team} className="flex items-center gap-4">
                      <div className="w-28 text-xs font-semibold text-[#323235] dark:text-[#e2e4f0] truncate">{item.team}</div>
                      <div className="flex-1 h-3 bg-[#f6f3f4] dark:bg-[#1e1f29] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: categoryColors[idx % categoryColors.length],
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#323235] dark:text-[#e2e4f0] w-12 text-right">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resolution by Category */}
            <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-6 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 flex flex-col">
              <div>
                <h3 className="font-manrope text-lg font-bold text-[#323235] dark:text-[#ffffff] mb-0.5">Tickets by Category</h3>
                <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs">Category distribution</p>
              </div>

              {/* Top category display */}
              <div className="flex-1 flex flex-col items-center justify-center py-4">
                <div className="relative w-32 h-32">
                   <div className="absolute inset-0 border-[12px] border-[#3b637b] dark:border-[#5a8cae] rounded-xl"></div>
                   <div className="absolute inset-[-4px] border-[4px] border-[#fcf8f9] dark:border-[#12131a] rounded-[1rem] z-10 pointer-events-none"></div>
                   <div className="absolute inset-0 border-[1px] border-[#f6f3f4] dark:border-[#1e1f29] rounded-xl m-[10px]"></div>
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#1e1f29] m-3 rounded-lg z-20">
                      <span className="font-manrope text-xl font-bold text-[#323235] dark:text-[#ffffff]">{topCatPercent}%</span>
                      <span className="text-[8px] font-bold text-[#5f5f62] dark:text-[#a0a5b5] tracking-[0.2em] mt-0.5 mr-[-0.2em] uppercase">{topCategory?.[0] || '—'}</span>
                   </div>
                </div>
              </div>

              <div className="space-y-3 px-1">
                {Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a).slice(0, 5).map(([cat, count], idx) => {
                  const pct = totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0;
                  return (
                    <div key={cat} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 text-[#323235] dark:text-[#e2e4f0] font-medium">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[idx % categoryColors.length] }}></div>
                        {cat}
                      </div>
                      <span className="font-semibold text-[#323235] dark:text-[#e2e4f0]">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function InsightsPage() {
  return (
    <ProtectedRoute requiredRole="Admin">
      <InsightsContent />
    </ProtectedRoute>
  );
}
