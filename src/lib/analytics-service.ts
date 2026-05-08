/**
 * Analytics & Reports API Service
 * Handles dashboard data, analytics, reports
 */

import { apiClient, ApiResponse } from './api-client';

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
  conversionRate: number;
  revenueGrowth: number; // percentage
  orderGrowth: number; // percentage
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  averageOrderValue: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  slug: string;
  category: string;
  sales: number;
  revenue: number;
  rating: number;
  reviewCount: number;
  stockStatus: string;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  productCount: number;
  sales: number;
  revenue: number;
  growth: number;
}

export interface LocationPerformance {
  locationId: string;
  locationName: string;
  revenue: number;
  orders: number;
  customers: number;
  topProduct: string;
}

export interface OrderMetrics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageDeliveryTime: number; // in days
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  returningCustomers: number;
  averageCustomerValue: number;
  customerRetentionRate: number;
  churnRate: number;
}

export interface RevenueReport {
  total: number;
  byPaymentMethod: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
  byCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  byLocation: Array<{
    location: string;
    amount: number;
    orders: number;
  }>;
  topProducts: ProductPerformance[];
}

export interface InventoryMetrics {
  totalItems: number;
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  averageStockTurnover: number;
  fastMovingProducts: ProductPerformance[];
  slowMovingProducts: ProductPerformance[];
}

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  locationId?: string;
  categoryId?: string;
  franchiseId?: string;
  currency?: string;
}

class AnalyticsService {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(dateFrom?: string, dateTo?: string): Promise<ApiResponse<DashboardMetrics>> {
    const params = new URLSearchParams({
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });

    return apiClient.get<DashboardMetrics>(
      `/analytics/dashboard-metrics?${params.toString()}`
    );
  }

  /**
   * Get sales trend data
   */
  async getSalesTrend(
    dateFrom: string,
    dateTo: string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<ApiResponse<SalesData[]>> {
    const params = new URLSearchParams({
      dateFrom,
      dateTo,
      period,
    });

    return apiClient.get<SalesData[]>(`/analytics/sales-trend?${params.toString()}`);
  }

  /**
   * Get top products
   */
  async getTopProducts(
    limit: number = 10,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<ProductPerformance[]>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });

    return apiClient.get<ProductPerformance[]>(`/analytics/top-products?${params.toString()}`);
  }

  /**
   * Get bottom products (slow movers)
   */
  async getBottomProducts(
    limit: number = 10,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<ProductPerformance[]>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });

    return apiClient.get<ProductPerformance[]>(
      `/analytics/bottom-products?${params.toString()}`
    );
  }

  /**
   * Get category performance
   */
  async getCategoryPerformance(
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<CategoryPerformance[]>> {
    const params = new URLSearchParams({
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });

    return apiClient.get<CategoryPerformance[]>(
      `/analytics/category-performance?${params.toString()}`
    );
  }

  /**
   * Get location performance
   */
  async getLocationPerformance(
    dateFrom?: string,
    dateTo?: string
  ): Promise<ApiResponse<LocationPerformance[]>> {
    const params = new URLSearchParams({
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });

    return apiClient.get<LocationPerformance[]>(
      `/analytics/location-performance?${params.toString()}`
    );
  }

  /**
   * Get order metrics
   */
  async getOrderMetrics(): Promise<ApiResponse<OrderMetrics>> {
    return apiClient.get<OrderMetrics>('/analytics/order-metrics');
  }

  /**
   * Get customer metrics
   */
  async getCustomerMetrics(): Promise<ApiResponse<CustomerMetrics>> {
    return apiClient.get<CustomerMetrics>('/analytics/customer-metrics');
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(filters: ReportFilters): Promise<ApiResponse<RevenueReport>> {
    const params = new URLSearchParams({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      ...(filters.locationId && { locationId: filters.locationId }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.franchiseId && { franchiseId: filters.franchiseId }),
      ...(filters.currency && { currency: filters.currency }),
    });

    return apiClient.get<RevenueReport>(`/analytics/revenue-report?${params.toString()}`);
  }

  /**
   * Get inventory metrics
   */
  async getInventoryMetrics(): Promise<ApiResponse<InventoryMetrics>> {
    return apiClient.get<InventoryMetrics>('/analytics/inventory-metrics');
  }

  /**
   * Get customer cohort analysis
   */
  async getCohortAnalysis(
    dateFrom: string,
    dateTo: string
  ): Promise<
    ApiResponse<
      Array<{
        cohortMonth: string;
        month0: number;
        month1: number;
        month2: number;
        month3: number;
        month6: number;
        month12: number;
      }>
    >
  > {
    const params = new URLSearchParams({
      dateFrom,
      dateTo,
    });

    return apiClient.get(`/analytics/cohort-analysis?${params.toString()}`);
  }

  /**
   * Get customer segmentation
   */
  async getCustomerSegmentation(): Promise<
    ApiResponse<
      Array<{
        segment: string;
        customerCount: number;
        revenue: number;
        averageOrderValue: number;
        purchaseFrequency: number;
      }>
    >
  > {
    return apiClient.get('/analytics/customer-segmentation');
  }

  /**
   * Get traffic sources
   */
  async getTrafficSources(
    dateFrom?: string,
    dateTo?: string
  ): Promise<
    ApiResponse<
      Array<{
        source: string;
        visits: number;
        conversions: number;
        conversionRate: number;
        revenue: number;
      }>
    >
  > {
    const params = new URLSearchParams({
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });

    return apiClient.get(`/analytics/traffic-sources?${params.toString()}`);
  }

  /**
   * Export report
   */
  async exportReport(
    reportType:
      | 'sales'
      | 'revenue'
      | 'inventory'
      | 'customers'
      | 'orders'
      | 'products',
    format: 'csv' | 'excel' | 'pdf',
    filters: ReportFilters
  ): Promise<Blob> {
    const params = new URLSearchParams({
      reportType,
      format,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      ...(filters.locationId && { locationId: filters.locationId }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.franchiseId && { franchiseId: filters.franchiseId }),
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'https://pme6ad6kdt.us-east-1.awsapprunner.comapi'}/analytics/export?${params.toString()}`,
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

  /**
   * Get custom report
   */
  async getCustomReport(query: {
    metrics: string[];
    dimensions: string[];
    filters?: Record<string, string>;
    sortBy?: string;
    limit?: number;
  }): Promise<
    ApiResponse<{
      columns: string[];
      rows: Record<string, any>[];
      summary: Record<string, any>;
    }>
  > {
    return apiClient.post('/analytics/custom-report', query);
  }
}

export const analyticsService = new AnalyticsService();
