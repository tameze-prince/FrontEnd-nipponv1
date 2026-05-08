/**
 * Authentication API Service
 * Aligned with the Spring Boot backend contracts.
 */

import { apiClient, ApiResponse } from './api-client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  countryId?: number;
  cityId?: number;
  referralCode?: string;
  avatar?: File;
}

export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone?: string;
  countryId?: string;
  country?: string;
  cityId?: string;
  city?: string;
  avatar?: string;
  role: 'customer' | 'admin' | 'owner' | 'partner';
  createdAt?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  role: 'CLIENT' | 'ADMIN' | 'OWNER' | 'PARTNER';
  userId: number;
  fullName: string;
  avatarUrl?: string;
}

interface BackendUserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'CLIENT' | 'ADMIN' | 'OWNER' | 'PARTNER';
  countryId?: number;
  countryName?: string;
  cityId?: number;
  cityName?: string;
  active?: boolean;
  createdAt?: string;
}

const REFRESH_TOKEN_KEY = 'refreshToken';

function failureResponse<T>(response: ApiResponse<unknown>): ApiResponse<T> {
  return {
    success: false,
    error: response.error,
    message: response.message,
    statusCode: response.statusCode,
  };
}

function mapRole(role: BackendAuthResponse['role'] | BackendUserResponse['role']): User['role'] {
  switch (role) {
    case 'ADMIN':
      return 'admin';
    case 'OWNER':
      return 'owner';
    case 'PARTNER':
      return 'partner';
    default:
      return 'customer';
  }
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || parts[0] || '',
  };
}

function mapAuthResponse(response: BackendAuthResponse, email = ''): LoginResponse {
  const { firstName, lastName } = splitFullName(response.fullName);

  return {
    token: response.accessToken,
    refreshToken: response.refreshToken,
    user: {
      id: String(response.userId),
      email,
      name: response.fullName,
      firstName,
      lastName,
      avatar: response.avatarUrl,
      role: mapRole(response.role),
    },
  };
}

function mapUserResponse(response: BackendUserResponse): User {
  return {
    id: String(response.id),
    email: response.email,
    name: `${response.firstName} ${response.lastName}`.trim(),
    firstName: response.firstName,
    lastName: response.lastName,
    phone: response.phone,
    avatar: response.avatarUrl,
    role: mapRole(response.role),
    countryId: response.countryId ? String(response.countryId) : undefined,
    country: response.countryName,
    cityId: response.cityId ? String(response.cityId) : undefined,
    city: response.cityName,
    createdAt: response.createdAt,
  };
}

class AuthService {
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<BackendAuthResponse>('/auth/login', { email, password });

    if (!response.success || !response.data) {
      return failureResponse<LoginResponse>(response);
    }

    const mapped = mapAuthResponse(response.data, email);
    apiClient.setToken(mapped.token);
    if (mapped.refreshToken && typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_KEY, mapped.refreshToken);
    }

    return {
      ...response,
      data: mapped,
    };
  }

  async register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const formData = new FormData();
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      countryId: data.countryId,
      cityId: data.cityId,
      referralCode: data.referralCode,
    };

    formData.append(
      'data',
      new Blob([JSON.stringify(payload)], { type: 'application/json' })
    );

    if (data.avatar) {
      formData.append('avatar', data.avatar);
    }

    const response = await apiClient.post<BackendAuthResponse>('/auth/register', formData);

    if (!response.success || !response.data) {
      return failureResponse<LoginResponse>(response);
    }

    const mapped = mapAuthResponse(response.data, data.email);
    apiClient.setToken(mapped.token);
    if (mapped.refreshToken && typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_TOKEN_KEY, mapped.refreshToken);
    }

    return {
      ...response,
      data: mapped,
    };
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await apiClient.get<BackendUserResponse>('/api/v1/users/me');

    if (!response.success || !response.data) {
      return failureResponse<User>(response);
    }

    return {
      ...response,
      data: mapUserResponse(response.data),
    };
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.put<BackendUserResponse>('/api/v1/users/me', {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });

    if (!response.success || !response.data) {
      return failureResponse<User>(response);
    }

    return {
      ...response,
      data: mapUserResponse(response.data),
    };
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const refreshToken =
      typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;

    apiClient.setToken(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    if (!refreshToken) {
      return { success: true, data: { message: 'Logged out' } };
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://pme6ad6kdt.us-east-1.awsapprunner.com'}/auth/logout`,
        {
          method: 'POST',
          headers: {
            'X-Refresh-Token': refreshToken,
          },
        }
      );

      if (!response.ok && response.status !== 204) {
        return {
          success: false,
          error: 'Logout failed',
          statusCode: response.status,
        };
      }

      return { success: true, data: { message: 'Logged out' }, statusCode: response.status };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  async refreshToken(refreshToken?: string): Promise<ApiResponse<LoginResponse>> {
    const token =
      refreshToken ||
      (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) || undefined : undefined);

    if (!token) {
      return {
        success: false,
        error: 'Missing refresh token',
      };
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://pme6ad6kdt.us-east-1.awsapprunner.com'}/auth/refresh`,
        {
          method: 'POST',
          headers: {
            'X-Refresh-Token': token,
          },
        }
      );

      const data = (await response.json()) as BackendAuthResponse;

      if (!response.ok) {
        return {
          success: false,
          error: 'Token refresh failed',
          statusCode: response.status,
        };
      }

      const mapped = mapAuthResponse(data);
      apiClient.setToken(mapped.token);

      if (mapped.refreshToken && typeof window !== 'undefined') {
        localStorage.setItem(REFRESH_TOKEN_KEY, mapped.refreshToken);
      }

      return {
        success: true,
        data: mapped,
        statusCode: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    void email;
    return {
      success: false,
      error: 'Password reset is not implemented in the backend yet.',
    };
  }

  async resetPassword(code: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    void code;
    void newPassword;
    return {
      success: false,
      error: 'Password reset is not implemented in the backend yet.',
    };
  }

  async verifyResetCode(code: string): Promise<ApiResponse<{ valid: boolean }>> {
    void code;
    return {
      success: false,
      error: 'Password reset is not implemented in the backend yet.',
    };
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    void currentPassword;
    void newPassword;
    return {
      success: false,
      error: 'Password change is not implemented in the backend yet.',
    };
  }
}

export const authService = new AuthService();
