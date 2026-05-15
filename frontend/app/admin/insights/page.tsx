'use client';

import { useEffect, useState } from 'react';
import { Activity, Ticket, Clock, CheckCircle2, Users, Brain, TrendingUp, Cpu, Zap } from 'lucide-react';
import { ProtectedRoute } from '@app/auth/ProtectedRoute';
import { fetchAdminStats, fetchAllTickets, fetchAllEmployees, fetchAIMetrics } from '@lib/api';

interface Stats {
  total_tickets: number;
  open_tickets: number;
  in_progress: number;
  resolved: number;
  total_employees: number;
}

interface AIMetric {
  value: number | null;
  display: string;
  label: string;
  description: string;
  interpretation: string;
  sample_size?: number;
  window_days?: number;
}

interface AIMetrics {
  cgr: AIMetric;
  rpi: AIMetric;
  hlo: AIMetric;
  sse: AIMetric;
  meta: { total_tickets: number; computed_at: string };
}

interface CategoryBreakdown {
  [key: string]: number;
}

// ── Metric gauge card ─────────────────────────────────────────────────────────
function MetricCard({
  label,
  display,
  description,
  value,
  icon: Icon,
  sampleSize,
  isScore = false,
}: {
  label: string;
  display: string;
  description: string;
  value: number | null;
  icon: React.ElementType;
  sampleSize?: number;
  isScore?: boolean;
}) {
  const isNA = value === null;

  // Colour thresholds
  const pct = isScore ? (value ?? 0) * 100 : (value ?? 0);
  const barColor = isNA
    ? '#9ca3af'
    : pct >= 80
    ? '#22c55e'   // green
    : pct >= 50
    ? '#f59e0b'   // amber
    : '#ef4444';  // red

  const barWidth = isNA ? 0 : Math.min(100, Math.max(0, pct));

  const statusLabel = isNA
    ? 'No data yet'
    : pct >= 80
    ? 'Good'
    : pct >= 50
    ? 'Moderate'
    : 'Needs Attention';

  return (
    <div className="bg-white dark:bg-[#252735] rounded-xl p-5 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 flex flex-col justify-between gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Icon size={18} strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#5f5f62] dark:text-[#a0a5b5]">{label}</p>
          </div>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: isNA ? '#9ca3af20' : `${barColor}18`,
            color: isNA ? '#9ca3af' : barColor,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Big number */}
      <div className="text-[32px] font-bold font-manrope leading-none text-[#323235] dark:text-white tracking-tight">
        {display}
      </div>

      {/* Bar */}
      <div className="space-y-1.5">
        <div className="h-1.5 rounded-full bg-[#f0eeee] dark:bg-[#1e1f29] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${barWidth}%`, backgroundColor: barColor }}
          />
        </div>
        <p className="text-[11px] text-[#9ca3af] dark:text-[#6b7280] leading-relaxed">{description}</p>
        {sampleSize !== undefined && (
          <p className="text-[10px] text-[#9ca3af] dark:text-[#6b7280]">
            Based on {sampleSize} ticket{sampleSize !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}

function InsightsContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown>({});
  const [teamBreakdown, setTeamBreakdown] = useState<{ team: string; count: number }[]>([]);
  const [aiMetrics, setAiMetrics] = useState<AIMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, ticketsData, employeesData, metricsData] = await Promise.all([
          fetchAdminStats(),
          fetchAllTickets(),
          fetchAllEmployees(),
          fetchAIMetrics(30),
        ]);
        setStats(statsData);
        setAiMetrics(metricsData);

        const cats: CategoryBreakdown = {};
        ticketsData.forEach((t: any) => {
          const cat = t.category || 'Uncategorized';
          cats[cat] = (cats[cat] || 0) + 1;
        });
        setCategoryBreakdown(cats);

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

  const topCategory = Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a)[0];
  const topCatPercent = topCategory && totalTickets > 0 ? Math.round((topCategory[1] / totalTickets) * 100) : 0;

  const categoryColors = ['#4285f4', '#5b9cf6', '#7ab3f8', '#b2b1b5', '#d4d3d7'];

  const aiCards = aiMetrics
    ? [
        { key: 'cgr', icon: Brain,     isScore: true,  ...aiMetrics.cgr },
        { key: 'rpi', icon: TrendingUp, isScore: false, ...aiMetrics.rpi },
        { key: 'hlo', icon: Zap,       isScore: false, ...aiMetrics.hlo },
        { key: 'sse', icon: Cpu,       isScore: true,  ...aiMetrics.sse },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#fcf8f9] dark:bg-[#12131a] text-[#323235] dark:text-[#f5f6fa] p-4 lg:p-8 font-sans">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary dark:text-primary mb-2">
          <Activity size={14} />
          <span className="text-xs font-semibold tracking-wide">System Intelligence Dashboard</span>
        </div>
        <h1 className="text-2xl leading-tight font-manrope font-bold text-[#323235] dark:text-[#ffffff] mb-1.5">
          Performance Insights
        </h1>
        <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-sm max-w-2xl leading-relaxed">
          Real-time resolution analytics and AI pipeline telemetry from the IT Ticket Solver.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── System Stats (existing 3-card row) ───────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-5 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-5">
                <div className="w-10 h-10 bg-[#f6f3f4] dark:bg-[#1e1f29] rounded-lg flex items-center justify-center text-primary dark:text-primary">
                  <Ticket size={20} strokeWidth={1.5} />
                </div>
              </div>
              <div>
                <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs font-medium mb-1">Total Tickets</p>
                <p className="font-manrope text-3xl font-bold text-[#323235] dark:text-[#ffffff] tracking-tight">{totalTickets}</p>
              </div>
            </div>

            <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-5 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-5">
                <div className="w-10 h-10 bg-[#fcf8f9] dark:bg-[#1e1f29] border border-[#f6f3f4] dark:border-transparent rounded-lg flex items-center justify-center text-primary dark:text-primary">
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
                   <div className="w-12 h-1 bg-primary dark:bg-primary rounded-full mb-2"></div>
                </div>
              </div>
            </div>

            <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-5 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-5">
                <div className="w-10 h-10 bg-[#f6f3f4] dark:bg-[#1e1f29] rounded-lg flex items-center justify-center text-primary dark:text-primary">
                  <Users size={20} strokeWidth={1.5} />
                </div>
              </div>
              <div>
                <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs font-medium mb-1">Active Employees</p>
                <p className="font-manrope text-3xl font-bold text-[#323235] dark:text-[#ffffff] tracking-tight">{stats?.total_employees || 0}</p>
              </div>
            </div>
          </div>

          {/* ── AI Performance Metrics (new 4-card row) ───────────────────── */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 text-primary">
                <Brain size={16} />
                <h2 className="text-sm font-bold tracking-wide uppercase">AI Pipeline Telemetry</h2>
              </div>
              <div className="flex-1 h-px bg-[#eeecee] dark:bg-white/5" />
              {aiMetrics?.meta?.computed_at && (
                <span className="text-[10px] text-[#a0a5b5]">
                  Updated {new Date(aiMetrics.meta.computed_at).toLocaleTimeString()}
                </span>
              )}
            </div>

            {aiCards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {aiCards.map((m) => (
                  <MetricCard
                    key={m.key}
                    label={m.label}
                    display={m.display}
                    description={m.description}
                    value={m.value}
                    icon={m.icon}
                    sampleSize={m.sample_size}
                    isScore={m.isScore}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[#a0a5b5] text-sm">
                AI metrics will appear after tickets have been processed through the pipeline.
              </div>
            )}
          </div>

          {/* ── Team Distribution + Category (existing row) ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                          style={{ width: `${pct}%`, backgroundColor: categoryColors[idx % categoryColors.length] }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#323235] dark:text-[#e2e4f0] w-12 text-right">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-6 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 flex flex-col">
              <div>
                <h3 className="font-manrope text-lg font-bold text-[#323235] dark:text-[#ffffff] mb-0.5">Tickets by Category</h3>
                <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs">Category distribution</p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center py-4">
                <div className="relative w-32 h-32">
                   <div className="absolute inset-0 border-[12px] border-primary dark:border-primary rounded-xl"></div>
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
