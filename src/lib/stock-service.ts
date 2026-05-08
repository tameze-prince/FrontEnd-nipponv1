/**
 * Stock/Inventory API Service
 * Handles product stock, inventory management, stock transfers
 */

import { apiClient, ApiResponse, PaginatedResponse, buildApiUrl } from './api-client';

export enum StockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued'
}

export interface Stock {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  status: StockStatus;
  reorderPoint: number;
  reorderQuantity?: number;
  lastRestockDate?: string;
  updatedAt: string;
}

export interface LocationStock {
  id: string;
  productId: string;
  variantId?: string;
  locationId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  status: StockStatus;
  updatedAt: string;
}

export interface StockTransfer {
  id: string;
  productId: string;
  variantId?: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  variantId?: string;
  locationId?: string;
  quantity: number;
  reason: string;
  notes?: string;
  adjustedBy?: string;
  createdAt: string;
}

export interface StockFilters {
  search?: string;
  status?: StockStatus;
  locationId?: string;
  lowStockOnly?: boolean;
}

interface BackendCountryStock {
  variantId: number;
  variantLabel: string;
  productName: string;
  countryCode: string;
  quantity: number;
  updatedAt: string;
}

interface BackendStockMovement {
  id?: number;
  variantId?: number;
  variant?: {
    id?: number;
    label?: string;
    product?: {
      name?: string;
    };
  };
  country?: {
    id?: number;
    code?: string;
  };
  quantityDelta: number;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOSS';
  reason?: string;
  createdAt: string;
}

class StockService {
  private mapCountryStock(item: BackendCountryStock) {
    return {
      id: `${item.variantId}-${item.countryCode}`,
      variantId: String(item.variantId),
      variantLabel: item.variantLabel,
      productName: item.productName,
      productId: String(item.variantId),
      countryId: item.countryCode,
      countryName: item.countryCode,
      quantity: item.quantity,
      updatedAt: item.updatedAt,
    };
  }

  private mapStockMovement(item: BackendStockMovement) {
    return {
      id: String(item.id ?? `${item.variant?.id ?? item.variantId}-${item.createdAt}`),
      variantId: String(item.variant?.id ?? item.variantId ?? ''),
      countryId: String(item.country?.id ?? item.country?.code ?? ''),
      variantLabel: item.variant?.label || 'Variante',
      productName: item.variant?.product?.name || 'Produit NipponHub',
      quantity: item.quantityDelta,
      movementType: item.movementType,
      reason: item.reason,
      createdAt: item.createdAt,
    };
  }

  /**
   * Get all stocks
   */
  async getStocks(
    page: number = 1,
    pageSize: number = 20,
    filters?: StockFilters
  ): Promise<ApiResponse<PaginatedResponse<Stock>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.locationId && { locationId: filters.locationId }),
      ...(filters?.lowStockOnly && { lowStockOnly: filters.lowStockOnly.toString() }),
    });

    return apiClient.get<PaginatedResponse<Stock>>(`/stocks?${params.toString()}`);
  }

  /**
   * Get stock by product
   */
  async getProductStock(productId: string): Promise<ApiResponse<Stock>> {
    return apiClient.get<Stock>(`/stocks/product/${productId}`);
  }

  /**
   * Get stock by product variant
   */
  async getVariantStock(productId: string, variantId: string): Promise<ApiResponse<Stock>> {
    return apiClient.get<Stock>(`/stocks/product/${productId}/variant/${variantId}`);
  }

  /**
   * Get stock at specific location
   */
  async getLocationStock(locationId: string, page: number = 1, pageSize: number = 20): Promise<
    ApiResponse<PaginatedResponse<LocationStock>>
  > {
    return apiClient.get<PaginatedResponse<LocationStock>>(
      `/stocks/location/${locationId}?page=${page}&pageSize=${pageSize}`
    );
  }

  /**
   * Get stock at location for specific product
   */
  async getProductLocationStock(
    productId: string,
    locationId: string
  ): Promise<ApiResponse<LocationStock>> {
    return apiClient.get<LocationStock>(
      `/stocks/product/${productId}/location/${locationId}`
    );
  }

  /**
   * Update stock (admin only)
   */
  async updateStock(
    stockId: string,
    data: {
      quantity: number;
      reorderPoint?: number;
      reorderQuantity?: number;
    }
  ): Promise<ApiResponse<Stock>> {
    return apiClient.put<Stock>(`/stocks/${stockId}`, data);
  }

  /**
   * Adjust stock (admin only)
   */
  async adjustStockLegacy(data: {
    productId: string;
    variantId?: string;
    locationId?: string;
    quantity: number; // positive or negative
    reason: string;
    notes?: string;
  }): Promise<ApiResponse<StockAdjustment>> {
    return apiClient.post<StockAdjustment>('/stocks/adjustments', data);
  }

  /**
   * Get stock adjustments history
   */
  async getStockAdjustments(
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      productId?: string;
      locationId?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<StockAdjustment>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(filters?.productId && { productId: filters.productId }),
      ...(filters?.locationId && { locationId: filters.locationId }),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo }),
    });

    return apiClient.get<PaginatedResponse<StockAdjustment>>(
      `/stocks/adjustments?${params.toString()}`
    );
  }

  /**
   * Transfer stock between locations (admin only)
   */
  async transferStock(data: {
    productId: string;
    variantId?: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    reason?: string;
  }): Promise<ApiResponse<StockTransfer>> {
    return apiClient.post<StockTransfer>('/stocks/transfers', data);
  }

  /**
   * Get stock transfers
   */
  async getTransfers(
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      status?: string;
      locationId?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<StockTransfer>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.locationId && { locationId: filters.locationId }),
    });

    return apiClient.get<PaginatedResponse<StockTransfer>>(
      `/stocks/transfers?${params.toString()}`
    );
  }

  /**
   * Update transfer status (admin only)
   */
  async updateTransferStatus(
    transferId: string,
    status: 'in_transit' | 'completed' | 'cancelled'
  ): Promise<ApiResponse<StockTransfer>> {
    return apiClient.put<StockTransfer>(`/stocks/transfers/${transferId}/status`, { status });
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(): Promise<
    ApiResponse<
      Array<{
        productId: string;
        productName: string;
        currentStock: number;
        reorderPoint: number;
        locationId: string;
        locationName: string;
      }>
    >
  > {
    return apiClient.get('/stocks/low-stock-items');
  }

  /**
   * Get stock summary by location
   */
  async getStockSummaryByLocation(): Promise<
    ApiResponse<
      Array<{
        locationId: string;
        locationName: string;
        totalItems: number;
        totalQuantity: number;
        lowStockItems: number;
        outOfStockItems: number;
      }>
    >
  > {
    return apiClient.get('/stocks/summary/by-location');
  }

  /**
   * Get stock report
   */
  async getStockReport(
    dateFrom?: string,
    dateTo?: string
  ): Promise<
    ApiResponse<{
      generatedAt: string;
      periodStart: string;
      periodEnd: string;
      totalProducts: number;
      totalQuantity: number;
      avgStockValue: number;
      lowStockCount: number;
      outOfStockCount: number;
      byLocation: Array<{
        locationId: string;
        locationName: string;
        quantity: number;
        value: number;
      }>;
      topMovingProducts: Array<{
        productId: string;
        productName: string;
        unitsSold: number;
        revenue: number;
      }>;
    }>
  > {
    const params = new URLSearchParams({
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });

    return apiClient.get(`/stocks/report?${params.toString()}`);
  }

  /**
   * Export stock report
   */
  async exportStockReport(
    format: 'csv' | 'excel',
    filters?: { locationId?: string; status?: StockStatus }
  ): Promise<Blob> {
    const params = new URLSearchParams({
      format,
      ...(filters?.locationId && { locationId: filters.locationId }),
      ...(filters?.status && { status: filters.status }),
    });

    const response = await fetch(
      buildApiUrl(`/stocks/export?${params.toString()}`),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Backend Integration Methods (/api/v1/stocks)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Get all stocks for a specific country (Backend API)
   * ADMIN/OWNER only
   */
  async getStocksByCountry(countryId: string | number, cityId?: string | number): Promise<
    ApiResponse<
      Array<{
        id: string;
        variantId: string;
        variantLabel: string;
        productName: string;
        productId: string;
        countryId: string;
        countryName: string;
        quantity: number;
        updatedAt: string;
      }>
    >
  > {
    const cityQuery = cityId !== undefined ? `&cityId=${cityId}` : '';
    const response = await apiClient.get<BackendCountryStock[]>(`/api/v1/stocks?countryId=${countryId}${cityQuery}`);

    if (!response.success || !response.data) {
      return response as ApiResponse<any>;
    }

    return {
      ...response,
      data: response.data.map((item) => this.mapCountryStock(item)),
    };
  }

  /**
   * Get low stock items for a country (Backend API)
   * ADMIN/OWNER only - items below threshold (default 5)
   */
  async getLowStocksByCountry(countryId: string | number, cityId?: string | number): Promise<
    ApiResponse<
      Array<{
        id: string;
        variantId: string;
        variantLabel: string;
        productName: string;
        productId: string;
        countryId: string;
        countryName: string;
        quantity: number;
        updatedAt: string;
      }>
    >
  > {
    const response = await apiClient.get<BackendCountryStock[]>(
      `/api/v1/stocks/low?countryId=${countryId}${cityId !== undefined ? `&cityId=${cityId}` : ''}`
    );

    if (!response.success || !response.data) {
      return response as ApiResponse<any>;
    }

    return {
      ...response,
      data: response.data.map((item) => this.mapCountryStock(item)),
    };
  }

  /**
   * Get stock movement history for a variant (Backend API)
   * ADMIN/OWNER only - shows audit trail
   */
  async getStockMovements(
    variantId: string | number,
    countryId: string | number,
    cityId?: string | number
  ): Promise<
    ApiResponse<
      Array<{
        id: string;
        variantId: string;
        countryId: string;
        variantLabel: string;
        productName: string;
        quantity: number;
        movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOSS';
        reason?: string;
        user?: string;
        createdAt: string;
      }>
    >
  > {
    const response = await apiClient.get<BackendStockMovement[]>(
      `/api/v1/stocks/movements?variantId=${variantId}&countryId=${countryId}${cityId !== undefined ? `&cityId=${cityId}` : ''}`
    );

    if (!response.success || !response.data) {
      return response as ApiResponse<any>;
    }

    return {
      ...response,
      data: response.data.map((item) => this.mapStockMovement(item)),
    };
  }

  /**
   * Adjust stock manually (Backend API)
   * ADMIN/OWNER only - creates IN/OUT/ADJUSTMENT/RETURN/DAMAGE/LOSS movement
   */
  async adjustStock(request: {
    variantId: string | number;
    countryId: string | number;
    quantity: number;
    movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOSS';
    reason?: string;
  }): Promise<
    ApiResponse<{
      id: string;
      variantId: string;
      variantLabel: string;
      productName: string;
      productId: string;
      countryId: string;
      countryName: string;
      quantity: number;
      updatedAt: string;
    }>
  > {
    const payload = {
      variantId: Number(request.variantId),
      countryId: Number(request.countryId),
      quantity: request.quantity,
      movementType: request.movementType,
      reason: request.reason || '',
    };

    return apiClient.post('/api/v1/stocks/adjust', payload);
  }

  /**
   * Check if a variant is in stock in a specific country
   */
  async isVariantInStock(
    variantId: string | number,
    countryId: string | number
  ): Promise<boolean> {
    const response = await this.getStocksByCountry(countryId);
    if (!response.success || !response.data) return false;

    const stock = response.data.find(
      (s) => String(s.variantId) === String(variantId)
    );
    return stock ? stock.quantity > 0 : false;
  }

  /**
   * Get stock quantity for a variant in a country
   */
  async getStockQuantity(
    variantId: string | number,
    countryId: string | number
  ): Promise<number> {
    const response = await this.getStocksByCountry(countryId);
    if (!response.success || !response.data) return 0;

    const stock = response.data.find(
      (s) => String(s.variantId) === String(variantId)
    );
    return stock ? stock.quantity : 0;
  }
}

export const stockService = new StockService();
