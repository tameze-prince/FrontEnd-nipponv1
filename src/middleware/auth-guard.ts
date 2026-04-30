/**
 * Authentication & Authorization Guard
 * Handles route protection and role-based access control
 */

export type UserRole = 'customer' | 'admin' | 'owner' | 'manager' | 'partner';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  country?: string;
  city?: string;
  avatar?: string;
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return null;

    const authData = JSON.parse(stored);
    return authData.state?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function getCurrentToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return null;

    const authData = JSON.parse(stored);
    return authData.state?.token || null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null && getCurrentToken() !== null;
}

export function hasRole(requiredRoles: UserRole[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin';
}

export function isOwner(): boolean {
  const user = getCurrentUser();
  return user?.role === 'owner';
}

export function isAdminOrOwner(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin' || user?.role === 'owner';
}

export function isCustomer(): boolean {
  const user = getCurrentUser();
  return user?.role === 'customer';
}

export function canCreateUsers(): boolean {
  const role = getCurrentUser()?.role;
  return role === 'admin' || role === 'owner';
}

export function canCreateRole(targetRole: UserRole): boolean {
  const currentRole = getCurrentUser()?.role;

  if (currentRole === 'admin') {
    return ['customer', 'owner', 'partner', 'manager'].includes(targetRole);
  }

  if (currentRole === 'owner') {
    return targetRole === 'partner';
  }

  return false;
}

export function getDashboardRoute(role?: UserRole): string {
  const userRole = role || getCurrentUser()?.role;

  switch (userRole) {
    case 'admin':
      return '/admin';
    case 'owner':
      return '/owner/dashboard';
    case 'partner':
      return '/partner';
    case 'manager':
      return '/manager/dashboard';
    default:
      return '/profile';
  }
}

export function requiresAdmin(operation: string): boolean {
  const adminOnlyOperations = [
    'create_user',
    'create_owner',
    'delete_user',
    'update_user_role',
    'bulk_create_products',
    'bulk_create_categories',
    'manage_franchises',
    'manage_currencies',
  ];

  return adminOnlyOperations.includes(operation);
}
