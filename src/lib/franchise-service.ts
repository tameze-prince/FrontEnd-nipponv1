/**
 * Franchise API Service
 * Aligned with `/api/v1/franchises`.
 */

import { apiClient, ApiResponse, PaginatedResponse } from './api-client';

export enum FranchiseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

export interface FranchiseLocation {
  id: string;
  name: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  managerId?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isHeadquarters: boolean;
}

export interface Franchise {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  imageUrl?: string;
  icon?: string;
  isActive?: boolean;
  status: FranchiseStatus;
  ownerId?: string;
  locations: FranchiseLocation[];
  totalLocations: number;
  createdAt: string;
  updatedAt: string;
}

export interface FranchiseStats {
  franchiseId: string;
  franchiseName: string;
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  monthlyOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  customerCount: number;
  locationStats: Array<{
    locationId: string;
    locationName: string;
    revenue: number;
    orders: number;
    topProduct: string;
  }>;
}

export interface FranchiseFilters {
  search?: string;
  status?: FranchiseStatus;
  country?: string;
  city?: string;
}

export interface FranchiseMutationInput {
  name?: string;
  slug?: string;
  logo?: File;
}

interface BackendFranchise {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  active: boolean;
}

function failureResponse<T>(response: ApiResponse<unknown>): ApiResponse<T> {
  return {
    success: false,
    error: response.error,
    message: response.message,
    statusCode: response.statusCode,
  };
}

function toFranchise(franchise: BackendFranchise): Franchise {
  return {
    id: String(franchise.id),
    name: franchise.name,
    slug: franchise.slug,
    description: '',
    logo: franchise.imageUrl,
    imageUrl: franchise.imageUrl,
    icon: '🎌',
    isActive: franchise.active,
    status: franchise.active ? FranchiseStatus.ACTIVE : FranchiseStatus.INACTIVE,
    locations: [],
    totalLocations: 0,
    createdAt: '',
    updatedAt: '',
  };
}

function toPaginated<T>(items: T[]): PaginatedResponse<T> {
  return {
    data: items,
    pagination: {
      page: 1,
      pageSize: items.length,
      total: items.length,
      totalPages: items.length > 0 ? 1 : 0,
    },
  };
}

class FranchiseService {
  async getFranchises(
    page: number = 1,
    pageSize: number = 20,
    filters?: FranchiseFilters
  ): Promise<ApiResponse<PaginatedResponse<Franchise>>> {
    void page;
    void pageSize;
    void filters;

    const response = await apiClient.get<BackendFranchise[]>('/api/v1/franchises');

    if (!response.success || !response.data) {
      return failureResponse<PaginatedResponse<Franchise>>(response);
    }

    return {
      ...response,
      data: toPaginated(response.data.map(toFranchise)),
    };
  }

  async getFranchise(id: string): Promise<ApiResponse<Franchise>> {
    const response = await this.getFranchises();

    if (!response.success || !response.data) {
      return failureResponse<Franchise>(response);
    }

    const item = response.data.data.find((franchise) => franchise.id === id);

    if (!item) {
      return {
        success: false,
        error: 'Franchise not found',
      };
    }

    return {
      success: true,
      data: item,
    };
  }

  async createFranchise(
    data: FranchiseMutationInput
  ): Promise<ApiResponse<Franchise>> {
    const formData = new FormData();
    formData.append('name', data.name || '');
    formData.append(
      'slug',
      data.slug ||
        (data.name || '')
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
    );

    const logo = data.logo as unknown;
    if (logo instanceof File) {
      formData.append('logo', logo);
    }

    const response = await apiClient.post<BackendFranchise>('/api/v1/franchises', formData);

    if (!response.success || !response.data) {
      return failureResponse<Franchise>(response);
    }

    return {
      ...response,
      data: toFranchise(response.data),
    };
  }

  async updateFranchise(
    id: string,
    data: FranchiseMutationInput
  ): Promise<ApiResponse<Franchise>> {
    const formData = new FormData();

    if (data.name) {
      formData.append('name', data.name);
    }

    const logo = data.logo as unknown;
    if (logo instanceof File) {
      formData.append('logo', logo);
    }

    const response = await apiClient.put<BackendFranchise>(`/api/v1/franchises/${id}`, formData);

    if (!response.success || !response.data) {
      return failureResponse<Franchise>(response);
    }

    return {
      ...response,
      data: toFranchise(response.data),
    };
  }

  async deleteFranchise(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/franchises/${id}`);
  }

  async updateFranchiseStatus(id: string, status: FranchiseStatus): Promise<ApiResponse<Franchise>> {
    void status;
    return this.getFranchise(id);
  }

  async getFranchiseLocations(franchiseId: string): Promise<ApiResponse<FranchiseLocation[]>> {
    void franchiseId;
    return { success: true, data: [] };
  }

  async getFranchiseLocation(
    franchiseId: string,
    locationId: string
  ): Promise<ApiResponse<FranchiseLocation>> {
    void franchiseId;
    void locationId;
    return { success: false, error: 'Franchise locations are not implemented in the backend yet.' };
  }

  async addLocation(
    franchiseId: string,
    data: Partial<FranchiseLocation>
  ): Promise<ApiResponse<FranchiseLocation>> {
    void franchiseId;
    void data;
    return { success: false, error: 'Franchise locations are not implemented in the backend yet.' };
  }

  async updateLocation(
    franchiseId: string,
    locationId: string,
    data: Partial<FranchiseLocation>
  ): Promise<ApiResponse<FranchiseLocation>> {
    void franchiseId;
    void locationId;
    void data;
    return { success: false, error: 'Franchise locations are not implemented in the backend yet.' };
  }

  async deleteLocation(franchiseId: string, locationId: string): Promise<ApiResponse<{ message: string }>> {
    void franchiseId;
    void locationId;
    return { success: false, error: 'Franchise locations are not implemented in the backend yet.' };
  }

  async getFranchiseStats(franchiseId: string): Promise<ApiResponse<FranchiseStats>> {
    void franchiseId;
    return { success: false, error: 'Franchise stats are not implemented in the backend yet.' };
  }

  async getAllFranchiseStats(): Promise<ApiResponse<FranchiseStats[]>> {
    return { success: false, error: 'Franchise stats are not implemented in the backend yet.' };
  }

  async getRevenueReport(
    franchiseId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<ApiResponse<any>> {
    void franchiseId;
    void dateFrom;
    void dateTo;
    return { success: false, error: 'Franchise reporting is not implemented in the backend yet.' };
  }

  async exportFranchiseReport(
    franchiseId: string,
    format: 'csv' | 'excel',
    dateFrom: string,
    dateTo: string
  ): Promise<Blob> {
    void franchiseId;
    void format;
    void dateFrom;
    void dateTo;
    throw new Error('Franchise reporting is not implemented in the backend yet.');
  }

  async getFranchisesByRegion(country: string): Promise<ApiResponse<Franchise[]>> {
    void country;
    return { success: true, data: [] };
  }

  async bulkUpdateStatus(franchiseIds: string[], status: FranchiseStatus): Promise<ApiResponse<any>> {
    void franchiseIds;
    void status;
    return { success: false, error: 'Bulk franchise status update is not implemented in the backend yet.' };
  }
}

export const franchiseService = new FranchiseService();
