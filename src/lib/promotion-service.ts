import { apiClient, ApiResponse } from './api-client';

export enum PromotionType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
  BUY_X_GET_Y = 'buy_x_get_y',
}

export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  EXHAUSTED = 'exhausted',
}

export interface Promotion {
  id: string;
  title: string;
  description?: string;
  type: PromotionType;
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashSale {
  id: string;
  productId: string;
  productName: string;
  discountPct: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdBy?: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: PromotionType;
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  status: CouponStatus;
  validFrom: string;
  validUntil: string;
  applicableToNewUsersOnly?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashSaleInput {
  productId: string;
  discountPct: number;
  startsAt: string;
  endsAt: string;
}

interface BackendFlashSale {
  id: number;
  product?: {
    id?: number;
    name?: string;
  };
  discountPct: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdBy?: {
    firstName?: string;
    lastName?: string;
  };
}

function failureResponse<T>(response: ApiResponse<unknown>): ApiResponse<T> {
  return {
    success: false,
    error: response.error,
    message: response.message,
    statusCode: response.statusCode,
  };
}

function mapFlashSale(item: BackendFlashSale): FlashSale {
  const createdByName = [item.createdBy?.firstName, item.createdBy?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    id: String(item.id),
    productId: String(item.product?.id || ''),
    productName: item.product?.name || 'Produit',
    discountPct: Number(item.discountPct),
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    active: Boolean(item.active),
    createdBy: createdByName || undefined,
  };
}

class PromotionService {
  async getFlashSales(): Promise<ApiResponse<FlashSale[]>> {
    const response = await apiClient.get<BackendFlashSale[]>('/api/v1/flash-sales');

    if (!response.success || !response.data) {
      return failureResponse<FlashSale[]>(response);
    }

    return {
      ...response,
      data: response.data.map(mapFlashSale),
    };
  }

  async createFlashSale(data: FlashSaleInput): Promise<ApiResponse<FlashSale>> {
    const response = await apiClient.post<BackendFlashSale>('/api/v1/flash-sales', {
      productId: Number(data.productId),
      discountPct: data.discountPct,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    });

    if (!response.success || !response.data) {
      return failureResponse<FlashSale>(response);
    }

    return {
      ...response,
      data: mapFlashSale(response.data),
    };
  }

  async updateFlashSale(id: string, data: FlashSaleInput): Promise<ApiResponse<FlashSale>> {
    const response = await apiClient.put<BackendFlashSale>(`/api/v1/flash-sales/${id}`, {
      productId: Number(data.productId),
      discountPct: data.discountPct,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    });

    if (!response.success || !response.data) {
      return failureResponse<FlashSale>(response);
    }

    return {
      ...response,
      data: mapFlashSale(response.data),
    };
  }

  async deleteFlashSale(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/api/v1/flash-sales/${id}`);
  }

  async getCoupons(): Promise<ApiResponse<{ data: Coupon[] }>> {
    return apiClient.get<{ data: Coupon[] }>('/admin/coupons');
  }

  async createCoupon(data: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
    return apiClient.post<Coupon>('/admin/coupons', data);
  }

  async updateCoupon(id: string, data: Partial<Coupon>): Promise<ApiResponse<Coupon>> {
    return apiClient.put<Coupon>(`/admin/coupons/${id}`, data);
  }

  async deleteCoupon(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/admin/coupons/${id}`);
  }
}

export const promotionService = new PromotionService();
