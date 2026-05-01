import { Search, Bell, Settings, Filter, Download, MoreVertical, Phone, Video, Mail } from 'lucide-react';

export default function EmployeesPage() {
  const employees = [
    {
      name: 'Floyd Miles',
      role: 'Staff Engineer',
      path: 'Complex path',
      score: 9.8,
      status: 'Online',
      avatar: 'https://i.pravatar.cc/150?img=11',
    },
    {
       name: 'Ronald Richards',
       role: 'Systems Analyst',
       path: 'Action path',
       score: 8.2,
       status: 'Offline',
       avatar: 'https://i.pravatar.cc/150?img=8',
    },
    {
       name: 'Arlene McCoy',
       role: 'Support Specialist',
       path: 'FAQ path',
       score: 9.5,
       status: 'Online',
       avatar: 'https://i.pravatar.cc/150?img=5',
    },
    {
       name: 'Jane Cooper',
       role: 'DevOps Engineer',
       path: 'Action path',
       score: 7.4,
       status: 'Online',
       avatar: 'https://i.pravatar.cc/150?img=9',
    },
    {
       name: 'Wade Warren',
       role: 'Lead Architect',
       path: 'Complex path',
       score: 9.2,
       status: 'Online',
       avatar: 'https://i.pravatar.cc/150?img=12',
    },
    {
       name: 'Bessie Cooper',
       role: 'Cloud Specialist',
       path: 'FAQ path',
       score: 8.8,
       status: 'Offline',
       avatar: 'https://i.pravatar.cc/150?img=15',
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcf8f9] dark:bg-[#12131a] text-[#323235] dark:text-[#f5f6fa] p-4 lg:p-8 font-sans">
      {/* Top Bar - consistent */}
      <div className="flex items-center justify-between mb-12">
        <div className="relative w-[32rem] max-w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f5f62] dark:text-[#a0a5b5]" />
          <input
            type="text"
            placeholder="Search staff directory..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#f6f3f4] dark:bg-[#1e1f29] rounded-full text-sm placeholder:text-[#5f5f62] dark:placeholder:text-[#a0a5b5] text-[#323235] dark:text-[#f5f6fa] border border-transparent dark:border-white/5 focus:outline-none focus:ring-[2px] focus:ring-[#3b637b]/40 focus:bg-[#ffffff] dark:focus:bg-[#252735] transition-all"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden border border-[#b2b1b5]/15 dark:border-white/10 cursor-pointer shrink-0">
             <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
          </div>
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
        <div className="flex gap-3 pb-2">
           <button className="flex items-center gap-2 bg-[#f6f3f4] dark:bg-[#1e1f29] hover:bg-[#eceae8] dark:hover:bg-[#252735] text-[#323235] dark:text-[#f5f6fa] px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-transparent dark:border-white/5">
              <Filter size={16} /> Filter
           </button>
           <button className="flex items-center gap-2 bg-[#f6f3f4] dark:bg-[#1e1f29] hover:bg-[#eceae8] dark:hover:bg-[#252735] text-[#323235] dark:text-[#f5f6fa] px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-transparent dark:border-white/5">
              <Download size={16} /> Export
           </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-[#ffffff] dark:bg-[#1a1b24] rounded-2xl shadow-[0px_12px_32px_rgba(13,60,82,0.04)] dark:shadow-none dark:border dark:border-white/5 overflow-hidden transition-colors">
        
        {/* Table Header Wrapper */}
        <div className="p-8 pb-4">
           {/* Section Title */}
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-manrope text-xl font-bold text-[#323235] dark:text-[#ffffff]">Active Personnel</h3>
              <span className="bg-[#f6f3f4] dark:bg-[#252735] text-[#5f5f62] dark:text-[#a0a5b5] text-xs font-semibold px-4 py-1.5 rounded-full tracking-wide">
                 Total: 248 Entries
              </span>
           </div>

           {/* Table Header Row */}
           <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_0.5fr] gap-4 pb-4 border-b border-[#f6f3f4]/60 dark:border-white/5 text-[11px] font-bold text-[#b2b1b5] dark:text-[#5f5f62] tracking-widest uppercase items-center">
              <div>EMPLOYEE</div>
              <div>AGENT TYPE (PATH)</div>
              <div>PERFORMANCE SCORE</div>
              <div>STATUS</div>
              <div className="text-right pr-4">ACTION</div>
           </div>
        </div>

        {/* Table List */}
        <div className="px-5 pb-6">
           {employees.map((emp, i) => (
             <div 
               key={i} 
               className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_0.5fr] gap-4 items-center group py-4 px-3 hover:bg-[#fcf8f9] dark:hover:bg-[#252735]/50 rounded-xl transition-colors cursor-pointer"
             >
               {/* Employee */}
               <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                     <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                     <p className="font-semibold text-[#323235] dark:text-[#f5f6fa] text-[15px] group-hover:text-[#3b637b] dark:group-hover:text-[#5a8cae] transition-colors">{emp.name}</p>
                     <p className="text-[#5f5f62] dark:text-[#a0a5b5] text-[13px] mt-0.5">{emp.role}</p>
                  </div>
               </div>
               
               {/* Agent Type */}
               <div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                     emp.path === 'Complex path' ? 'bg-[#e1f5fe]/70 text-[#0288d1] dark:bg-[#0288d1]/20 dark:text-[#4fc3f7]' : 
                     emp.path === 'Action path' ? 'bg-[#f3e5f5]/70 text-[#7b1fa2] dark:bg-[#7b1fa2]/20 dark:text-[#ba68c8]' : 
                     'bg-[#e8f5e9]/70 text-[#388e3c] dark:bg-[#388e3c]/20 dark:text-[#81c784]'
                  }`}>
                     {emp.path}
                  </span>
               </div>
               
               {/* Performance */}
               <div className="flex items-center gap-3">
                  <div className="w-full max-w-[140px] h-2 bg-[#f6f3f4] dark:bg-[#12131a] rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-[#3b637b] dark:bg-[#5a8cae] rounded-full" 
                        style={{ width: `${(emp.score / 10) * 100}%` }}
                     ></div>
                  </div>
                  <span className="font-semibold text-[#323235] dark:text-[#e2e4f0] text-sm">{emp.score}</span>
               </div>
               
               {/* Status */}
               <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${emp.status === 'Online' ? 'bg-[#388e3c] dark:bg-[#4caf50]' : 'bg-[#b2b1b5] dark:bg-[#5f5f62]'}`}></div>
                  <span className="text-[#5f5f62] dark:text-[#a0a5b5] text-sm font-medium">{emp.status}</span>
               </div>
               
               {/* Action */}
               <div className="flex justify-end pr-4 opacity-60 group-hover:opacity-100 transition-opacity text-[#b2b1b5] dark:text-[#5f5f62]">
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#3b637b] hover:text-white dark:hover:bg-[#5a8cae] dark:hover:text-white transition-colors">
                     <MoreVertical size={16} />
                  </button>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
