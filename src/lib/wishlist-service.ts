/**
 * Wishlist API Service
 * Handles favorite products (simplified to API_DOCUMENTATION.md endpoints)
 * Mapped from: GET /api/v1/wishlist, POST /api/v1/wishlist/{variantId}, DELETE /api/v1/wishlist/{variantId}
 */

import { apiClient, ApiResponse } from './api-client';

export interface WishlistProduct {
  id?: string;
  name?: string;
  slug?: string;
  basePrice?: number;
  imageUrls?: string[];
}

export interface WishlistVariant {
  id?: string;
  productName?: string;
  color?: string;
  size?: string;
  label?: string;
  sku?: string;
  price?: number;
  finalPrice?: number;
  extraPrice?: number;
  image?: string;
  imageUrl?: string;
  product?: WishlistProduct;
}

export interface WishlistItem {
  id: string;
  userId?: string;
  variantId: string;
  addedAt: string;
  createdAt?: string;
  variant?: WishlistVariant;
}

/**
 * Simplified Wishlist interface aligned with backend
 */
export interface Wishlist {
  items: WishlistItem[];
  totalItems: number;
}

interface BackendWishlistItem {
  id: number;
  user?: {
    id?: number;
  };
  variant?: {
    id?: number;
    label?: string;
    imageUrl?: string;
    extraPrice?: number;
    product?: {
      id?: number;
      name?: string;
      slug?: string;
      basePrice?: number;
      imageUrls?: string[];
    };
  };
  createdAt?: string;
}

type PlaceholderPayload = Record<string, never>;

function failureResponse<T>(response: ApiResponse<unknown>): ApiResponse<T> {
  return {
    success: false,
    error: response.error,
    message: response.message,
    statusCode: response.statusCode,
  };
}

function asNumber(value: number | string | undefined | null): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function mapWishlistItem(item: BackendWishlistItem): WishlistItem {
  const basePrice = asNumber(item.variant?.product?.basePrice) || 0;
  const extraPrice = asNumber(item.variant?.extraPrice) || 0;
  const variantId = item.variant?.id ? String(item.variant.id) : '';

  return {
    id: String(item.id),
    userId: item.user?.id ? String(item.user.id) : undefined,
    variantId,
    addedAt: item.createdAt || new Date().toISOString(),
    createdAt: item.createdAt,
    variant: item.variant
      ? {
          id: variantId,
          label: item.variant.label,
          productName: item.variant.product?.name,
          price: basePrice + extraPrice,
          image: item.variant.imageUrl || item.variant.product?.imageUrls?.[0],
          imageUrl: item.variant.imageUrl,
          extraPrice,
          product: item.variant.product
            ? {
                id: item.variant.product.id ? String(item.variant.product.id) : undefined,
                name: item.variant.product.name,
                slug: item.variant.product.slug,
                basePrice,
                imageUrls: item.variant.product.imageUrls,
              }
            : undefined,
        }
      : undefined,
  };
}

class WishlistService {
  /**
   * Get my wishlist (all wishlist items)
   * Mapped from: GET /api/v1/wishlist
   */
  async getWishlist(): Promise<ApiResponse<WishlistItem[]>> {
    const response = await apiClient.get<BackendWishlistItem[]>('/api/v1/wishlist');

    if (!response.success || !response.data) {
      return failureResponse<WishlistItem[]>(response);
    }

    return {
      ...response,
      data: response.data.map(mapWishlistItem),
    };
  }

  /**
   * Add variant to wishlist
   * Mapped from: POST /api/v1/wishlist/{variantId}
   */
  async addToWishlist(variantId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>(`/api/v1/wishlist/${variantId}`);
    return response;
  }

  /**
   * Remove variant from wishlist
   * Mapped from: DELETE /api/v1/wishlist/{variantId}
   */
  async removeFromWishlist(variantId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/v1/wishlist/${variantId}`);
  }

  /**
   * Check if variant is in wishlist
   * Helper method - queries local wishlist
   */
  async isInWishlist(variantId: string): Promise<boolean> {
    const response = await this.getWishlist();
    if (!response.success || !response.data) return false;
    return response.data.some(item => item.variantId === variantId);
  }

  /**
   * Get wishlist item count
   * Helper method
   */
  async getWishlistCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await this.getWishlist();
    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error,
      };
    }
    return {
      success: true,
      data: { count: response.data.length },
    };
  }

  // Deprecated/Not implemented methods from API_DOCUMENTATION
  /**
   * Multiple wishlists not supported in current backend API
   * TODO: Implement in backend if needed
   */
  async getWishlists(): Promise<ApiResponse<PlaceholderPayload[]>> {
    console.warn('Multiple wishlists not supported - backend only has single wishlist per user');
    return {
      success: false,
      error: 'Multiple wishlists not supported in current backend',
    };
  }

  async createWishlist(_data: unknown): Promise<ApiResponse<PlaceholderPayload>> {
    console.warn('Multiple wishlists not supported');
    return {
      success: false,
      error: 'Multiple wishlists not supported in current backend',
    };
  }

  async updateWishlist(_wishlistId: string, _data: unknown): Promise<ApiResponse<PlaceholderPayload>> {
    console.warn('Multiple wishlists not supported');
    return {
      success: false,
      error: 'Multiple wishlists not supported in current backend',
    };
  }

  async deleteWishlist(_wishlistId: string): Promise<ApiResponse<PlaceholderPayload>> {
    console.warn('Multiple wishlists not supported');
    return {
      success: false,
      error: 'Multiple wishlists not supported in current backend',
    };
  }

  async moveWishlistItem(
    _itemId: string,
    _targetWishlistId: string
  ): Promise<ApiResponse<PlaceholderPayload>> {
    console.warn('Multiple wishlists not supported');
    return {
      success: false,
      error: 'Multiple wishlists not supported in current backend',
    };
  }

  async shareWishlist(_wishlistId: string): Promise<ApiResponse<PlaceholderPayload>> {
    console.warn('Wishlist sharing not implemented in backend');
    return {
      success: false,
      error: 'Wishlist sharing not implemented in backend',
    };
  }

  async getPublicWishlist(_shareToken: string): Promise<ApiResponse<PlaceholderPayload>> {
    console.warn('Wishlist sharing not implemented in backend');
    return {
      success: false,
      error: 'Wishlist sharing not implemented in backend',
    };
  }

  async wishlistToCart(_wishlistId: string): Promise<ApiResponse<PlaceholderPayload>> {
    console.warn('Wishlist to cart not implemented in backend');
    return {
      success: false,
      error: 'Wishlist to cart not implemented in backend',
    };
  }

  async getRecommendations(_wishlistId?: string): Promise<ApiResponse<PlaceholderPayload[]>> {
    console.warn('Wishlist recommendations not implemented in backend');
    return {
      success: false,
      error: 'Wishlist recommendations not implemented in backend',
    };
  }

  async getWishlistAnalytics(): Promise<ApiResponse<PlaceholderPayload>> {
    console.warn('Wishlist analytics not implemented in backend');
    return {
      success: false,
      error: 'Wishlist analytics not implemented in backend',
    };
  }
}

export const wishlistService = new WishlistService();
