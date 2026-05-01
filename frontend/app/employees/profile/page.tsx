'use client';

import { useState } from 'react';
import { User, Mail, Briefcase, Tag, Save, Zap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    name: 'Jane Doe',
    email: 'jane.doe@architectural-ledger.com',
    role: 'L2 Support Engineer',
    category: 'Hardware Diagnostics',
    specialization: 'Hardware Wallets, Sync Issues',
    maxTickets: '5',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    toast.success('Profile updated successfully!');
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8f7f9] dark:bg-[#12131a] text-[#323235] dark:text-[#f5f6fa]">
      <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[32px] font-manrope font-bold text-[#1e2a35] dark:text-[#e8edf5] leading-tight tracking-tight">
              Employee Profile
            </h1>
            <p className="text-[14px] text-[#5f5f62] dark:text-[#a0a5b5] mt-1">
              Manage your personal information and support settings.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1a1b24] rounded-2xl shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5 overflow-hidden">
            {/* Avatar Section */}
            <div className="p-8 border-b border-[#f0eff0] dark:border-white/5 flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#f8f7f9] dark:border-[#12131a] bg-gray-200 dark:bg-gray-700 shadow-sm">
                  <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <button className="absolute bottom-0 right-0 bg-[#3b637b] dark:bg-[#2e576e] text-white p-2 rounded-full shadow-md hover:bg-[#2e576e] dark:hover:bg-[#467393] transition-colors">
                  <User size={14} />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1e2a35] dark:text-[#e8edf5]">{formData.name}</h2>
                <div className="flex items-center gap-2 mt-1.5 text-[#5f5f62] dark:text-[#a0a5b5] text-[13px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Active - Receiving Tickets
                </div>
              </div>
            </div>

            {/* Form Details */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold tracking-wide uppercase text-[#5f5f62] dark:text-[#a0a5b5] flex items-center gap-1.5">
                    <User size={14} /> Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-[#f6f3f4] dark:bg-[#252735] border border-transparent dark:border-white/5 rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b637b]/30 transition-shadow text-[#323235] dark:text-[#e2e4f0]"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold tracking-wide uppercase text-[#5f5f62] dark:text-[#a0a5b5] flex items-center gap-1.5">
                    <Mail size={14} /> Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-[#f6f3f4] dark:bg-[#252735] border border-transparent dark:border-white/5 rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b637b]/30 transition-shadow text-[#323235] dark:text-[#e2e4f0]"
                  />
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold tracking-wide uppercase text-[#5f5f62] dark:text-[#a0a5b5] flex items-center gap-1.5">
                    <Briefcase size={14} /> Title / Role
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-[#f6f3f4] dark:bg-[#252735] border border-transparent dark:border-white/5 rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b637b]/30 transition-shadow text-[#323235] dark:text-[#e2e4f0]"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold tracking-wide uppercase text-[#5f5f62] dark:text-[#a0a5b5] flex items-center gap-1.5">
                    <Tag size={14} /> Support Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-[#f6f3f4] dark:bg-[#252735] border border-transparent dark:border-white/5 rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b637b]/30 transition-shadow text-[#323235] dark:text-[#e2e4f0] appearance-none"
                  >
                    <option value="Hardware Diagnostics">Hardware Diagnostics</option>
                    <option value="Software & Sync">Software & Sync</option>
                    <option value="Network Infrastructure">Network Infrastructure</option>
                    <option value="Account & Billing">Account & Billing</option>
                  </select>
                </div>
              </div>

              <hr className="border-[#f0eff0] dark:border-white/5 my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Specialization */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold tracking-wide uppercase text-[#5f5f62] dark:text-[#a0a5b5] flex items-center gap-1.5">
                    <Zap size={14} /> Specializations
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="e.g. Firmware updates, Subnet routing"
                    className="w-full bg-[#f6f3f4] dark:bg-[#252735] border border-transparent dark:border-white/5 rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b637b]/30 transition-shadow text-[#323235] dark:text-[#e2e4f0]"
                  />
                  <p className="text-[11px] text-[#8e8d91] dark:text-[#888c99]">Comma-separated list of your technical expertise.</p>
                </div>

                {/* Max Tickets */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold tracking-wide uppercase text-[#5f5f62] dark:text-[#a0a5b5] flex items-center gap-1.5">
                    <AlertCircle size={14} /> Max Concurrent Tickets
                  </label>
                  <input
                    type="number"
                    name="maxTickets"
                    value={formData.maxTickets}
                    onChange={handleChange}
                    min="1"
                    max="20"
                    className="w-full bg-[#f6f3f4] dark:bg-[#252735] border border-transparent dark:border-white/5 rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b637b]/30 transition-shadow text-[#323235] dark:text-[#e2e4f0]"
                  />
                  <p className="text-[11px] text-[#8e8d91] dark:text-[#888c99]">Maximum number of active tickets you can handle at once.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 flex justify-end gap-3">
                <button className="px-5 py-2.5 rounded-lg font-bold text-[13px] text-[#323235] dark:text-[#e2e4f0] bg-white dark:bg-[#1a1b24] hover:bg-[#f0f4f6] dark:hover:bg-[#252735] border border-[#e0dede] dark:border-white/10 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-lg font-bold text-[13px] text-white bg-[#3b637b] dark:bg-[#2e576e] hover:bg-[#2e576e] dark:hover:bg-[#24465a] shadow-sm flex items-center gap-2 transition-colors"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
