/**
 * Category API Service
 * Aligned with `/api/v1/categories`.
 */

import { apiClient, ApiResponse, PaginatedResponse } from './api-client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  parentId?: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTree extends Category {
  children?: CategoryTree[];
}

export interface CategoryFilters {
  search?: string;
  parentId?: string;
  isActive?: boolean;
}

interface BackendCategory {
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

function toCategory(category: BackendCategory): Category {
  return {
    id: String(category.id),
    name: category.name,
    slug: category.slug,
    image: category.imageUrl,
    imageUrl: category.imageUrl,
    isActive: category.active,
    level: 0,
    sortOrder: 0,
    productCount: 0,
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

class CategoryService {
  async createCategory(data: {
    name?: string;
    slug?: string;
    image?: File;
  }): Promise<ApiResponse<Category>> {
    const formData = new FormData();
    formData.append('name', data.name || '');
    formData.append('slug', data.slug || '');

    if (data.image) {
      formData.append('image', data.image);
    }

    const response = await apiClient.post<BackendCategory>('/api/v1/categories', formData);

    if (!response.success || !response.data) {
      return failureResponse<Category>(response);
    }

    return {
      ...response,
      data: toCategory(response.data),
    };
  }

  async updateCategory(
    id: string,
    data: {
      name?: string;
      image?: File;
    }
  ): Promise<ApiResponse<Category>> {
    const formData = new FormData();

    if (data.name) {
      formData.append('name', data.name);
    }

    if (data.image) {
      formData.append('image', data.image);
    }

    const response = await apiClient.put<BackendCategory>(`/api/v1/categories/${id}`, formData);

    if (!response.success || !response.data) {
      return failureResponse<Category>(response);
    }

    return {
      ...response,
      data: toCategory(response.data),
    };
  }

  async getCategories(
    page: number = 1,
    pageSize: number = 50,
    filters?: CategoryFilters
  ): Promise<ApiResponse<PaginatedResponse<Category>>> {
    void page;
    void pageSize;
    void filters;

    const response = await apiClient.get<BackendCategory[]>('/api/v1/categories');

    if (!response.success || !response.data) {
      return failureResponse<PaginatedResponse<Category>>(response);
    }

    const items = response.data.map(toCategory);
    return {
      ...response,
      data: toPaginated(items),
    };
  }

  async getCategoryTree(): Promise<ApiResponse<CategoryTree[]>> {
    const response = await this.getCategories();

    if (!response.success || !response.data) {
      return failureResponse<CategoryTree[]>(response);
    }

    return {
      ...response,
      data: response.data.data,
    };
  }

  async getCategory(id: string): Promise<ApiResponse<Category>> {
    const response = await this.getCategories();

    if (!response.success || !response.data) {
      return failureResponse<Category>(response);
    }

    const item = response.data.data.find((category) => category.id === id);

    if (!item) {
      return {
        success: false,
        error: 'Category not found',
      };
    }

    return {
      success: true,
      data: item,
    };
  }

  async getCategoryBySlug(slug: string): Promise<ApiResponse<Category>> {
    const response = await this.getCategories();

    if (!response.success || !response.data) {
      return failureResponse<Category>(response);
    }

    const item = response.data.data.find((category) => category.slug === slug);

    if (!item) {
      return {
        success: false,
        error: 'Category not found',
      };
    }

    return {
      success: true,
      data: item,
    };
  }

  async getSubcategories(parentId: string): Promise<ApiResponse<Category[]>> {
    void parentId;
    return {
      success: true,
      data: [],
    };
  }

  async deleteCategory(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/categories/${id}`);
  }

  async reorderCategories(items: Array<{ id: string; sortOrder: number }>): Promise<
    ApiResponse<{
      updated: number;
      message: string;
    }>
  > {
    void items;
    return {
      success: false,
      error: 'Category reordering is not implemented in the backend yet.',
    };
  }

  async bulkUpdateStatus(categoryIds: string[], isActive: boolean): Promise<
    ApiResponse<{
      updated: number;
      message: string;
    }>
  > {
    void categoryIds;
    void isActive;
    return {
      success: false,
      error: 'Bulk status update is not implemented in the backend yet.',
    };
  }
}

export const categoryService = new CategoryService();
