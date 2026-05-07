'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'User' | 'Employee' | 'Admin';
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, isLoading, isUserType } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Not authenticated - redirect to login
      router.push(redirectTo);
      return;
    }

    // Check role requirement
    if (requiredRole && !isUserType(requiredRole)) {
      // User doesn't have the required role
      // Redirect based on their actual role
      if (isUserType('Admin')) {
        router.push('/admin/tickets');
      } else if (isUserType('Employee')) {
        router.push('/employees/resolve');
      } else if (isUserType('User')) {
        router.push('/user/support');
      }
      return;
    }
  }, [user, isLoading, requiredRole, isUserType, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

// HOC for protecting pages
export function withProtected<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: 'User' | 'Employee' | 'Admin'
) {
  return function Protected(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}
