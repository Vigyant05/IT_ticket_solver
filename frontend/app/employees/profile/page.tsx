'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Briefcase, Tag, Zap, AlertCircle, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@app/auth/ProtectedRoute';
import { useAuth } from '@app/auth/AuthContext';
import { fetchEmployee } from '@lib/api';

interface EmployeeData {
  id: number;
  name: string;
  email: string;
  role: string;
  team: string;
  expertise_tags: string[];
  skill_level: number;
  current_load: number;
  availability_status: boolean;
  avg_resolution_time: number;
  priority_handling_capability: string;
}

function ProfileContent() {
  const { user } = useAuth();
  const [empData, setEmpData] = useState<EmployeeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      try {
        const data = await fetchEmployee(user.id);
        setEmpData(data);
      } catch (error) {
        console.error('Failed to load profile', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#f8f7f9] dark:bg-[#12131a]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!empData) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#f8f7f9] dark:bg-[#12131a]">
        <p className="text-[#5f5f62]">No profile data available.</p>
      </div>
    );
  }

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
              Your personal information and support settings.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1a1b24] rounded-2xl shadow-[0px_4px_24px_rgba(13,60,82,0.06)] dark:shadow-none dark:border dark:border-white/5 overflow-hidden">
            {/* Avatar Section */}
            <div className="p-8 border-b border-[#f0eff0] dark:border-white/5 flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#f8f7f9] dark:border-[#12131a] bg-gradient-to-tr from-primary to-primary/70 shadow-sm flex items-center justify-center text-white text-3xl font-bold">
                  {empData.name.charAt(0)}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1e2a35] dark:text-[#e8edf5]">{empData.name}</h2>
                <div className="flex items-center gap-2 mt-1.5 text-[#5f5f62] dark:text-[#a0a5b5] text-[13px] font-medium">
                  <span className={`w-2 h-2 rounded-full ${empData.availability_status ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {empData.availability_status ? 'Active - Receiving Tickets' : 'Busy - At Capacity'}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold tracking-wide uppercase text-[#5f5f62] dark:text-[#a0a5b5] flex items-center gap-1.5">
                    <User size={14} /> Full Name
                  </label>
                  <div className="w-full bg-[#f6f3f4] dark:bg-[#252735] border border-transparent dark:border-white/5 rounded-lg px-4 py-2.5 text-[14px] text-[#323235] dark:text-[#e2e4f0]">
                    {empData.name}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold tracking-wide uppercase text-[#5f5f62] dark:text-[#a0a5b5] flex items-center gap-1.5">
                    <Mail size={14} /> Email Address
                  </label>
                  <div className="w-full bg-[#f6f3f4] dark:bg-[#252735] border border-transparent dark:border-white/5 rounded-lg px-4 py-2.5 text-[14px] text-[#323235] dark:text-[#e2e4f0]">
                    {empData.email}
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold tracking-wide uppercase text-[#5f5f62] dark:text-[#a0a5b5] flex items-center gap-1.5">
                    <Briefcase size={14} /> Title / Role
                  </label>
                  <div className="w-full bg-[#f6f3f4] dark:bg-[#252735] border border-transparent dark:border-white/5 rounded-lg px-4 py-2.5 text-[14px] text-[#323235] dark:text-[#e2e4f0]">
                    {empData.role}
                  </div>
                </div>

                {/* Team */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold tracking-wide uppercase text-[#5f5f62] dark:text-[#a0a5b5] flex items-center gap-1.5">
                    <Shield size={14} /> Team
                  </label>
                  <div className="w-full bg-[#f6f3f4] dark:bg-[#252735] border border-transparent dark:border-white/5 rounded-lg px-4 py-2.5 text-[14px] text-[#323235] dark:text-[#e2e4f0]">
                    {empData.team}
                  </div>
                </div>
              </div>

              <hr className="border-[#f0eff0] dark:border-white/5 my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expertise Tags */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold tracking-wide uppercase text-[#5f5f62] dark:text-[#a0a5b5] flex items-center gap-1.5">
                    <Zap size={14} /> Expertise Areas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {empData.expertise_tags.length > 0 ? (
                      empData.expertise_tags.map((tag) => (
                        <span key={tag} className="px-3 py-1.5 bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary rounded-lg text-[12px] font-semibold">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[13px] text-[#a0a5b5]">No expertise tags assigned</span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold tracking-wide uppercase text-[#5f5f62] dark:text-[#a0a5b5] flex items-center gap-1.5">
                    <AlertCircle size={14} /> Performance Stats
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#f6f3f4] dark:bg-[#252735] rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-primary dark:text-primary">{empData.skill_level}/5</p>
                      <p className="text-[10px] text-[#5f5f62] dark:text-[#a0a5b5] font-semibold mt-0.5">Skill Level</p>
                    </div>
                    <div className="bg-[#f6f3f4] dark:bg-[#252735] rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-primary dark:text-primary">{empData.current_load}</p>
                      <p className="text-[10px] text-[#5f5f62] dark:text-[#a0a5b5] font-semibold mt-0.5">Current Load</p>
                    </div>
                    <div className="bg-[#f6f3f4] dark:bg-[#252735] rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-primary dark:text-primary">{empData.priority_handling_capability}</p>
                      <p className="text-[10px] text-[#5f5f62] dark:text-[#a0a5b5] font-semibold mt-0.5">Priority Cap.</p>
                    </div>
                    <div className="bg-[#f6f3f4] dark:bg-[#252735] rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-primary dark:text-primary">{empData.avg_resolution_time || 0}h</p>
                      <p className="text-[10px] text-[#5f5f62] dark:text-[#a0a5b5] font-semibold mt-0.5">Avg Resolution</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute requiredRole="Employee">
      <ProfileContent />
    </ProtectedRoute>
  );
}
