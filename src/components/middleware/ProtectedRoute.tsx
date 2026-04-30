'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/middleware/auth-guard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * Wraps pages that require authentication and/or specific roles
 * 
 * Usage:
 * <ProtectedRoute requiredRoles={['admin', 'owner']}>
 *   <AdminPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredRoles = [],
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Wait a moment for store to hydrate
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!isAuthenticated || !user) {
        router.push('/auth/login');
        return;
      }

      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as UserRole)) {
        router.push('/unauthorized');
        return;
      }

      setIsChecking(false);
    };

    checkAccess();
  }, [isAuthenticated, user, requiredRoles, router]);

  if (isChecking) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role as UserRole)) {
    return null;
  }

  return <>{children}</>;
}
