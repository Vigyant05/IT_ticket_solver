import { Search, Bell, Settings, Activity, Ticket, Clock, CheckCircle2 } from 'lucide-react';

export default function InsightsPage() {
  return (
    <div className="min-h-screen bg-[#fcf8f9] dark:bg-[#12131a] text-[#323235] dark:text-[#f5f6fa] p-4 lg:p-8 font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="relative w-[28rem] max-w-full">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f5f62] dark:text-[#a0a5b5]" />
          <input
            type="text"
            placeholder="Search analytics..."
            className="w-full pl-10 pr-4 py-2 bg-[#f6f3f4] dark:bg-[#1e1f29] rounded-full text-xs placeholder:text-[#5f5f62] dark:placeholder:text-[#a0a5b5] text-[#323235] dark:text-[#f5f6fa] border border-transparent dark:border-white/5 focus:outline-none focus:ring-[2px] focus:ring-[#3b637b]/40 focus:bg-[#ffffff] dark:focus:bg-[#252735]"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden border border-[#b2b1b5]/15 dark:border-white/10 cursor-pointer shrink-0">
             <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

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
          Real-time resolution analytics and operational velocity metrics for the current architectural cycle.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Card 1 */}
        <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-5 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-5">
            <div className="w-10 h-10 bg-[#f6f3f4] dark:bg-[#1e1f29] rounded-lg flex items-center justify-center text-[#3b637b] dark:text-[#5a8cae]">
              <Ticket size={20} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 bg-[#f6f3f4] dark:bg-[#1e1f29] text-[#5f5f62] dark:text-[#a0a5b5] rounded-full">
              +12% vs LY
            </span>
          </div>
          <div>
            <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs font-medium mb-1">Total Tickets</p>
            <p className="font-manrope text-3xl font-bold text-[#323235] dark:text-[#ffffff] tracking-tight">1,284</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-5 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-5">
            <div className="w-10 h-10 bg-[#fcf8f9] dark:bg-[#1e1f29] border border-[#f6f3f4] dark:border-transparent rounded-lg flex items-center justify-center text-[#3b637b] dark:text-[#5a8cae]">
              <CheckCircle2 size={20} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 bg-[#f6f3f4] dark:bg-[#1e1f29] text-[#5f5f62] dark:text-[#a0a5b5] rounded-full">
              Exceeding KPI
            </span>
          </div>
          <div>
            <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs font-medium mb-1">Resolution Rate</p>
            <div className="flex items-end gap-3">
               <p className="font-manrope text-3xl font-bold text-[#323235] dark:text-[#ffffff] tracking-tight">85%</p>
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
            <span className="text-[10px] font-semibold px-2.5 py-1 bg-[#f6f3f4] dark:bg-[#1e1f29] text-[#5f5f62] dark:text-[#a0a5b5] rounded-full">
              Critical Metric
            </span>
          </div>
          <div>
            <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs font-medium mb-1">Avg Response Time</p>
            <p className="font-manrope text-3xl font-bold text-[#323235] dark:text-[#ffffff] tracking-tight">1.2h</p>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Volume Trend */}
        <div className="lg:col-span-2 bg-[#ffffff] dark:bg-[#252735] rounded-xl p-6 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="font-manrope text-lg font-bold text-[#323235] dark:text-[#ffffff] mb-0.5">Ticket Volume Trend</h3>
              <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs">Daily incoming request velocity</p>
            </div>
            <div className="flex bg-[#f6f3f4] dark:bg-[#1e1f29] rounded-md p-1">
              <button className="px-3 py-1 text-[10px] font-semibold bg-[#3b637b] dark:bg-[#5a8cae] text-white rounded shadow-sm">7D</button>
              <button className="px-3 py-1 text-[10px] font-semibold text-[#5f5f62] dark:text-[#a0a5b5] hover:text-[#323235] dark:hover:text-[#ffffff]">30D</button>
            </div>
          </div>
          
          {/* Chart Placeholder Area */}
          <div className="h-[220px] w-full flex flex-col justify-end relative pb-6">
              {/* Fake SVG Chart */}
              <div className="absolute inset-0 flex items-end opacity-90 mx-4 mb-6">
                  <svg viewBox="0 0 800 240" className="w-full h-full" preserveAspectRatio="none">
                     <path d="M0,200 C200,200 300,220 400,160 C500,100 600,40 800,80 L800,240 L0,240 Z" fill="currentColor" className="text-[#3b637b]/5 dark:text-[#5a8cae]/10" />
                     <path d="M0,200 C200,200 300,220 400,160 C500,100 600,40 800,80" fill="none" stroke="currentColor" className="text-[#3b637b] dark:text-[#5a8cae]" strokeWidth="3" />
                  </svg>
              </div>
              
              {/* X Axis Labels */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between px-4 text-[9px] font-bold text-[#b2b1b5] dark:text-[#5f5f62] tracking-widest uppercase">
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
                <span>SUN</span>
              </div>
          </div>
        </div>

        {/* Resolution by Category */}
        <div className="bg-[#ffffff] dark:bg-[#252735] rounded-xl p-6 shadow-[0px_8px_24px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 flex flex-col">
          <div>
            <h3 className="font-manrope text-lg font-bold text-[#323235] dark:text-[#ffffff] mb-0.5">Resolution by Category</h3>
            <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-xs">Departmental ticket allocation</p>
          </div>
          
          {/* Donut Chart Placeholder */}
          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <div className="relative w-32 h-32">
               {/* Just a stylized square donut per the minimal design */}
               <div className="absolute inset-0 border-[12px] border-[#3b637b] dark:border-[#5a8cae] rounded-xl"></div>
               <div className="absolute inset-[-4px] border-[4px] border-[#fcf8f9] dark:border-[#12131a] rounded-[1rem] z-10 pointer-events-none"></div>
               <div className="absolute inset-0 border-[1px] border-[#f6f3f4] dark:border-[#1e1f29] rounded-xl m-[10px]"></div>
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#1e1f29] m-3 rounded-lg z-20">
                  <span className="font-manrope text-xl font-bold text-[#323235] dark:text-[#ffffff]">40%</span>
                  <span className="text-[8px] font-bold text-[#5f5f62] dark:text-[#a0a5b5] tracking-[0.2em] mt-0.5 mr-[-0.2em]">SOFTWARE</span>
               </div>
            </div>
          </div>

          <div className="space-y-3 px-1">
             <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-[#323235] dark:text-[#ffffff] font-medium"><div className="w-2 h-2 rounded-full bg-[#3b637b] dark:bg-[#5a8cae]"></div> Software</div>
                <span className="font-semibold text-[#323235] dark:text-[#ffffff]">40%</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-[#5f5f62] dark:text-[#a0a5b5]"><div className="w-2 h-2 rounded-full bg-[#3b637b]/60 dark:bg-[#5a8cae]/60"></div> Hardware</div>
                <span className="font-semibold text-[#5f5f62] dark:text-[#a0a5b5]">25%</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-[#5f5f62] dark:text-[#a0a5b5]"><div className="w-2 h-2 rounded-full bg-[#b2b1b5] dark:bg-[#5f5f62]"></div> Access</div>
                <span className="font-semibold text-[#5f5f62] dark:text-[#a0a5b5]">20%</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-[#5f5f62] dark:text-[#a0a5b5]"><div className="w-2 h-2 rounded-full bg-[#f6f3f4] dark:bg-[#1e1f29]"></div> Network</div>
                <span className="font-semibold text-[#5f5f62] dark:text-[#a0a5b5]">15%</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
