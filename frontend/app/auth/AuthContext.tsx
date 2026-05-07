'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'User' | 'Employee' | 'Admin';
  team?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isUserType: (role: 'User' | 'Employee' | 'Admin') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from sessionStorage on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('auth_token');
    const storedUser = sessionStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string, role: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        sessionStorage.setItem('auth_token', data.token);
        sessionStorage.setItem('auth_user', JSON.stringify(data.user));
        toast.success(`Welcome back, ${data.user.name}!`);
        return true;
      } else {
        toast.error(data.message || 'Login failed');
        return false;
      }
    } catch (error) {
      toast.error('Failed to connect to server');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    // Call logout API (fire and forget)
    if (token) {
      fetch(`${API_BASE}/api/logout?token=${token}`, {
        method: 'POST',
      }).catch(() => {});
    }

    setToken(null);
    setUser(null);
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    toast.success('Logged out successfully');
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, [token]);

  const isAuthenticated = !!user && !!token;

  const isUserType = useCallback((role: 'User' | 'Employee' | 'Admin'): boolean => {
    if (!user) return false;
    if (role === 'Admin') return user.role === 'Admin';
    if (role === 'Employee') {
      return ['Associate', 'Specialist', 'Senior Engineer', 'Architect',
              'DevOps Engineer', 'Cloud Architect', 'SRE', 'Cloud Engineer',
              'Security Analyst', 'Security Specialist', 'Penetration Tester',
              'Security Engineer'].includes(user.role);
    }
    if (role === 'User') return user.role === 'User';
    return false;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      logout,
      isAuthenticated,
      isUserType,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
