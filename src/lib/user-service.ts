/**
 * User API Service
 * Handles profile, addresses, and admin user functions.
 */

import { apiClient, type ApiResponse, type PaginatedResponse } from './api-client';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  OWNER = 'owner',
  PARTNER = 'partner',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  country?: string;
  city?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile extends User {
  bio?: string;
  address?: string;
  defaultAddressId?: string;
  totalOrders: number;
  totalSpent: number;
  joinDate: string;
  preferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    newsletter: boolean;
  };
}

export interface UserAddress {
  id: string;
  userId: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

interface BackendUserResponse {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: 'CLIENT' | 'ADMIN' | 'OWNER' | 'PARTNER';
  countryName?: string;
  cityName?: string;
  active: boolean;
  createdAt: string;
  loyaltyPoints?: number;
}

interface BackendUserAddress {
  id: number;
  userId: number;
  label: string;
  firstName: string;
  lastName?: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

function failureResponse<T>(response: ApiResponse<unknown>): ApiResponse<T> {
  return {
    success: false,
    error: response.error,
    message: response.message,
    statusCode: response.statusCode,
  };
}

function mapRole(role: BackendUserResponse['role']): UserRole {
  switch (role) {
    case 'ADMIN':
      return UserRole.ADMIN;
    case 'OWNER':
      return UserRole.OWNER;
    case 'PARTNER':
      return UserRole.PARTNER;
    case 'CLIENT':
    default:
      return UserRole.CUSTOMER;
  }
}

function toBackendRole(role: UserRole): string {
  switch (role) {
    case UserRole.CUSTOMER:
      return 'CLIENT';
    case UserRole.ADMIN:
      return 'ADMIN';
    case UserRole.OWNER:
      return 'OWNER';
    case UserRole.PARTNER:
      return 'PARTNER';
    default:
      return 'CLIENT';
  }
}

function mapStatus(active: boolean): UserStatus {
  return active ? UserStatus.ACTIVE : UserStatus.INACTIVE;
}

function mapUser(user: BackendUserResponse): UserProfile {
  return {
    id: String(user.id),
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email,
    phone: user.phone,
    avatar: user.avatarUrl,
    role: mapRole(user.role),
    status: mapStatus(user.active),
    country: user.countryName,
    city: user.cityName,
    createdAt: user.createdAt,
    updatedAt: user.createdAt,
    totalOrders: 0,
    totalSpent: 0,
    joinDate: user.createdAt,
  };
}

function mapAddress(address: BackendUserAddress): UserAddress {
  return {
    id: String(address.id),
    userId: String(address.userId),
    label: address.label,
    firstName: address.firstName,
    lastName: address.lastName || '',
    phone: address.phone,
    address: address.address,
    city: address.city,
    state: address.state,
    country: address.country,
    postalCode: address.postalCode,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

class UserService {
  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.get<BackendUserResponse>('/api/v1/users/me');

    if (!response.success || !response.data) {
      return failureResponse<UserProfile>(response);
    }

    return {
      ...response,
      data: mapUser(response.data),
    };
  }

  async getUser(userId: string): Promise<ApiResponse<User>> {
    const response = await this.getUserProfile(userId);

    if (!response.success || !response.data) {
      return failureResponse<User>(response);
    }

    return {
      ...response,
      data: response.data,
    };
  }

  async getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    const endpoint = userId === 'me' ? '/api/v1/users/me' : `/api/v1/users/${userId}`;
    const response = await apiClient.get<BackendUserResponse>(endpoint);

    if (!response.success || !response.data) {
      return failureResponse<UserProfile>(response);
    }

    return {
      ...response,
      data: mapUser(response.data),
    };
  }

  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.put<BackendUserResponse>('/api/v1/users/me', {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });

    if (!response.success || !response.data) {
      return failureResponse<UserProfile>(response);
    }

    return {
      ...response,
      data: mapUser(response.data),
    };
  }

  async updatePreferences(preferences: Record<string, boolean>): Promise<ApiResponse<UserProfile>> {
    return this.updateProfile({ preferences } as UserProfile);
  }

  async updateAvatar(file: File): Promise<ApiResponse<UserProfile>> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.patch<BackendUserResponse>('/api/v1/users/me/avatar', formData);

    if (!response.success || !response.data) {
      return failureResponse<UserProfile>(response);
    }

    return {
      ...response,
      data: mapUser(response.data),
    };
  }

  async getAddresses(): Promise<ApiResponse<UserAddress[]>> {
    const response = await apiClient.get<BackendUserAddress[]>('/api/v1/users/me/addresses');

    if (!response.success || !response.data) {
      return failureResponse<UserAddress[]>(response);
    }

    return {
      ...response,
      data: response.data.map(mapAddress),
    };
  }

  async getAddress(addressId: string): Promise<ApiResponse<UserAddress>> {
    const response = await apiClient.get<BackendUserAddress>(`/api/v1/users/me/addresses/${addressId}`);

    if (!response.success || !response.data) {
      return failureResponse<UserAddress>(response);
    }

    return {
      ...response,
      data: mapAddress(response.data),
    };
  }

  async createAddress(
    data: Omit<UserAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<UserAddress>> {
    const response = await apiClient.post<BackendUserAddress>('/api/v1/users/me/addresses', data);

    if (!response.success || !response.data) {
      return failureResponse<UserAddress>(response);
    }

    return {
      ...response,
      data: mapAddress(response.data),
    };
  }

  async updateAddress(addressId: string, data: Partial<UserAddress>): Promise<ApiResponse<UserAddress>> {
    const current = await this.getAddress(addressId);

    if (!current.success || !current.data) {
      return failureResponse<UserAddress>(current);
    }

    const merged = {
      ...current.data,
      ...data,
    };
    const payload = {
      label: merged.label,
      firstName: merged.firstName,
      lastName: merged.lastName,
      phone: merged.phone,
      address: merged.address,
      city: merged.city,
      state: merged.state,
      country: merged.country,
      postalCode: merged.postalCode,
      isDefault: merged.isDefault,
    };

    const response = await apiClient.put<BackendUserAddress>(`/api/v1/users/me/addresses/${addressId}`, payload);

    if (!response.success || !response.data) {
      return failureResponse<UserAddress>(response);
    }

    return {
      ...response,
      data: mapAddress(response.data),
    };
  }

  async deleteAddress(addressId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/users/me/addresses/${addressId}`);
  }

  async setDefaultAddress(addressId: string): Promise<ApiResponse<UserAddress>> {
    const response = await apiClient.patch<BackendUserAddress>(
      `/api/v1/users/me/addresses/${addressId}/default`
    );

    if (!response.success || !response.data) {
      return failureResponse<UserAddress>(response);
    }

    return {
      ...response,
      data: mapAddress(response.data),
    };
  }

  async getUsers(
    countryId?: number,
    page: number = 1,
    pageSize: number = 20,
    filters?: UserFilters
  ): Promise<ApiResponse<PaginatedResponse<User>>> {
    const params = new URLSearchParams({
      page: String(Math.max(0, page - 1)),
      size: String(pageSize),
    });

    if (countryId) {
      params.set('countryId', String(countryId));
    }

    if (filters?.role) {
      params.set('role', toBackendRole(filters.role));
    }

    const response = await apiClient.get<{
      content: BackendUserResponse[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    }>(`/api/v1/users?${params.toString()}`);

    if (!response.success || !response.data) {
      return failureResponse<PaginatedResponse<User>>(response);
    }

    let data = response.data.content.map(mapUser);

    if (filters?.search?.trim()) {
      const query = filters.search.trim().toLowerCase();
      data = data.filter((user) =>
        [user.firstName, user.lastName, user.email, user.phone]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query))
      );
    }

    return {
      ...response,
      data: {
        data,
        pagination: {
          page: (response.data.number || 0) + 1,
          pageSize: response.data.size || data.length,
          total: response.data.totalElements || data.length,
          totalPages: response.data.totalPages || 1,
        },
      },
    };
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    const response = await apiClient.get<BackendUserResponse[]>(
      `/api/v1/users/search?q=${encodeURIComponent(query)}`
    );

    if (!response.success || !response.data) {
      return failureResponse<User[]>(response);
    }

    return {
      ...response,
      data: response.data.map(mapUser),
    };
  }

  async getUserAdmin(userId: string): Promise<ApiResponse<UserProfile>> {
    return this.getUserProfile(userId);
  }

  async updateUserAdmin(userId: string, data: Partial<User>): Promise<ApiResponse<User>> {
    void userId;
    void data;
    return {
      success: false,
      error: 'Update user endpoint not yet available',
    };
  }

  async updateUserRole(userId: string, role: UserRole): Promise<ApiResponse<User>> {
    const response = await apiClient.patch<BackendUserResponse>(
      `/api/v1/users/${userId}/role?role=${toBackendRole(role)}`
    );

    if (!response.success || !response.data) {
      return failureResponse<User>(response);
    }

    return {
      ...response,
      data: mapUser(response.data),
    };
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<ApiResponse<User>> {
    const isActive = status === UserStatus.ACTIVE;
    const response = await apiClient.patch<BackendUserResponse>(
      `/api/v1/users/${userId}/active?active=${isActive}`
    );

    if (!response.success || !response.data) {
      return failureResponse<User>(response);
    }

    return {
      ...response,
      data: mapUser(response.data),
    };
  }

  async deleteUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch<{ message: string }>(`/api/v1/users/${userId}/active?active=false`);
  }

  async getUserStats(): Promise<ApiResponse<{
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    totalSpentAllTime: number;
    averageOrderValue: number;
    byRole: Partial<Record<UserRole, number>>;
    byStatus: Partial<Record<UserStatus, number>>;
  }>> {
    const response = await this.getUsers(undefined, 1, 100);

    if (!response.success || !response.data) {
      return failureResponse<{
        totalUsers: number;
        activeUsers: number;
        newUsersThisMonth: number;
        totalSpentAllTime: number;
        averageOrderValue: number;
        byRole: Partial<Record<UserRole, number>>;
        byStatus: Partial<Record<UserStatus, number>>;
      }>(response);
    }

    const users = response.data.data;
    const byRole: Partial<Record<UserRole, number>> = {};
    const byStatus: Partial<Record<UserStatus, number>> = {};

    users.forEach((user) => {
      byRole[user.role] = (byRole[user.role] || 0) + 1;
      byStatus[user.status] = (byStatus[user.status] || 0) + 1;
    });

    return {
      success: true,
      data: {
        totalUsers: users.length,
        activeUsers: users.filter((user) => user.status === UserStatus.ACTIVE).length,
        newUsersThisMonth: 0,
        totalSpentAllTime: 0,
        averageOrderValue: 0,
        byRole,
        byStatus,
      },
    };
  }

  async exportUsers(_format: 'csv' | 'excel', _filters?: UserFilters): Promise<Blob> {
    throw new Error('Export users not implemented in current backend');
  }

  async sendVerificationEmail(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/users/me/send-verification-email', {});
  }

  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/users/verify-email', { token });
  }
}

export const userService = new UserService();
