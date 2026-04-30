import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';
import { authService } from '@/lib/auth-service';

export type UserRole = 'customer' | 'admin' | 'owner' | 'manager' | 'partner';

interface User {
  id?: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  countryId?: string;
  country?: string;
  cityId?: string;
  city?: string;
  createdAt?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Partial<User> & { password: string }) => Promise<void>;
  createUser: (data: Partial<User> & { password: string }, role: UserRole) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
  isAdmin: () => boolean;
  isOwner: () => boolean;
  isAdminOrOwner: () => boolean;
  isCustomer: () => boolean;
  canCreateUsers: () => boolean;
  canCreateRole: (role: UserRole) => boolean;
  getDashboardRoute: () => string;
}

function getDashboardRouteForRole(role?: UserRole): string {
  switch (role) {
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

function canUserCreateRole(currentRole: UserRole | undefined, targetRole: UserRole): boolean {
  if (currentRole === 'admin') {
    return ['customer', 'owner', 'partner', 'manager'].includes(targetRole);
  }

  if (currentRole === 'owner') {
    return targetRole === 'partner';
  }

  return false;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setToken: (token) => {
        apiClient.setToken(token);
        set({ token });
      },

      setError: (error) => set({ error }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Login failed');
          }

          set({
            user: response.data.user,
            token: response.data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      register: async (data: Partial<User> & { password: string }) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            password: data.password,
          });

          if (!response.success || !response.data) {
            throw new Error(response.error || 'Registration failed');
          }

          set({
            user: response.data.user,
            token: response.data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      createUser: async (data: Partial<User> & { password: string }, role: UserRole) => {
        void data;
        set({ isLoading: true, error: null });
        try {
          const currentUser = get().user;

          if (!currentUser || !canUserCreateRole(currentUser.role, role)) {
            const errorMsg = `User with role "${currentUser?.role || 'guest'}" cannot create "${role}" accounts`;
            set({ error: errorMsg, isLoading: false });
            throw new Error(errorMsg);
          }

          await new Promise((resolve) => setTimeout(resolve, 1500));
          set({ isLoading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'User creation failed';
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      logout: () => {
        apiClient.setToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      isAdmin: () => get().user?.role === 'admin',
      isOwner: () => get().user?.role === 'owner',
      isAdminOrOwner: () => {
        const role = get().user?.role;
        return role === 'admin' || role === 'owner';
      },
      isCustomer: () => get().user?.role === 'customer',
      canCreateUsers: () => ['admin', 'owner'].includes(get().user?.role || ''),
      canCreateRole: (role) => canUserCreateRole(get().user?.role, role),
      getDashboardRoute: () => getDashboardRouteForRole(get().user?.role),

      hydrate: () => {
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
