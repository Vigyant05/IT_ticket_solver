'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Download, MoreVertical } from 'lucide-react';
import { ProtectedRoute } from '@app/auth/ProtectedRoute';
import { fetchAllEmployees } from '@lib/api';

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  team: string;
  expertise_tags: string[];
  skill_level: number;
  current_load: number;
  availability_status: boolean;
}

function EmployeesContent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await fetchAllEmployees();
        setEmployees(data);
      } catch (error) {
        console.error('Failed to load employees', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadEmployees();
  }, []);

  const filtered = employees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q) ||
      emp.team.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q)
    );
  });

  const getTeamColor = (team: string) => {
    const colors: Record<string, string> = {
      'L1 Support': 'bg-[#e8f5e9]/70 text-[#388e3c] dark:bg-[#388e3c]/20 dark:text-[#81c784]',
      'L2 Application': 'bg-[#f3e5f5]/70 text-[#7b1fa2] dark:bg-[#7b1fa2]/20 dark:text-[#ba68c8]',
      'L3 Infrastructure': 'bg-[#e1f5fe]/70 text-[#0288d1] dark:bg-[#0288d1]/20 dark:text-[#4fc3f7]',
      'DevOps': 'bg-[#fff3e0]/70 text-[#e65100] dark:bg-[#e65100]/20 dark:text-[#ffab40]',
      'Security': 'bg-[#fce4ec]/70 text-[#c62828] dark:bg-[#c62828]/20 dark:text-[#ef9a9a]',
    };
    return colors[team] || 'bg-[#f6f3f4] text-[#5f5f62] dark:bg-[#1e1f29] dark:text-[#a0a5b5]';
  };

  return (
    <div className="min-h-screen bg-[#fcf8f9] dark:bg-[#12131a] text-[#323235] dark:text-[#f5f6fa] p-4 lg:p-8 font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-12">
        <div className="relative w-[32rem] max-w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f5f62] dark:text-[#a0a5b5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff directory..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#f6f3f4] dark:bg-[#1e1f29] rounded-full text-sm placeholder:text-[#5f5f62] dark:placeholder:text-[#a0a5b5] text-[#323235] dark:text-[#f5f6fa] border border-transparent dark:border-white/5 focus:outline-none focus:ring-[2px] focus:ring-primary/40 focus:bg-[#ffffff] dark:focus:bg-[#252735] transition-all"
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl leading-tight font-manrope font-bold text-[#323235] dark:text-[#ffffff] mb-2">
            Staff Directory
          </h1>
          <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-[15px] max-w-2xl leading-relaxed">
            Comprehensive registry of IT Resolver experts and system architects.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        /* Main Container */
        <div className="bg-[#ffffff] dark:bg-[#1a1b24] rounded-2xl shadow-[0px_12px_32px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 overflow-hidden transition-colors">
          {/* Table Header Wrapper */}
          <div className="p-8 pb-4">
             <div className="flex justify-between items-center mb-8">
                <h3 className="font-manrope text-xl font-bold text-[#323235] dark:text-[#ffffff]">Active Personnel</h3>
                <span className="bg-[#f6f3f4] dark:bg-[#252735] text-[#5f5f62] dark:text-[#a0a5b5] text-xs font-semibold px-4 py-1.5 rounded-full tracking-wide">
                   Total: {filtered.length} Entries
                </span>
             </div>

             <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_0.5fr] gap-4 pb-4 border-b border-[#f6f3f4]/60 dark:border-white/5 text-[11px] font-bold text-[#b2b1b5] dark:text-[#5f5f62] tracking-widest uppercase items-center">
                <div>EMPLOYEE</div>
                <div>TEAM</div>
                <div>SKILL LEVEL</div>
                <div>STATUS</div>
                <div className="text-right pr-4">LOAD</div>
             </div>
          </div>

          {/* Table List */}
          <div className="px-5 pb-6">
             {filtered.map((emp) => (
               <div
                 key={emp.id}
                 className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_0.5fr] gap-4 items-center group py-4 px-3 hover:bg-[#fcf8f9] dark:hover:bg-[#252735]/50 rounded-xl transition-colors cursor-pointer"
               >
                 {/* Employee */}
                 <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-tr from-primary to-primary/70 shrink-0 flex items-center justify-center text-white font-bold text-sm">
                       {emp.name.charAt(0)}
                    </div>
                    <div>
                       <p className="font-semibold text-[#323235] dark:text-[#f5f6fa] text-[15px] group-hover:text-primary dark:group-hover:text-primary transition-colors">{emp.name}</p>
                       <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-[13px] mt-0.5">{emp.role}</p>
                    </div>
                 </div>

                 {/* Team */}
                 <div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getTeamColor(emp.team)}`}>
                       {emp.team}
                    </span>
                 </div>

                 {/* Skill Level */}
                 <div className="flex items-center gap-3">
                    <div className="w-full max-w-[140px] h-2 bg-[#f6f3f4] dark:bg-[#12131a] rounded-full overflow-hidden">
                       <div
                          className="h-full bg-primary dark:bg-primary rounded-full"
                          style={{ width: `${(emp.skill_level / 5) * 100}%` }}
                       ></div>
                    </div>
                    <span className="font-semibold text-[#323235] dark:text-[#e2e4f0] text-sm">{emp.skill_level}/5</span>
                 </div>

                 {/* Status */}
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${emp.availability_status ? 'bg-[#388e3c] dark:bg-[#4caf50]' : 'bg-[#b2b1b5] dark:bg-[#5f5f62]'}`}></div>
                    <span className="text-[#5f5f62] dark:text-[#a0a5b5] text-sm font-medium">{emp.availability_status ? 'Available' : 'Busy'}</span>
                 </div>

                 {/* Load */}
                 <div className="text-right pr-4">
                    <span className="text-sm font-bold text-[#323235] dark:text-[#e2e4f0]">{emp.current_load}</span>
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <ProtectedRoute requiredRole="Admin">
      <EmployeesContent />
    </ProtectedRoute>
  );
}
