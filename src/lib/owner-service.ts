import { apiClient, type ApiResponse } from './api-client';

export interface OwnerCountryKpi {
  countryId: number;
  countryName: string;
  countryCode: string;
  currency: string;
  revenue: number;
  totalOrders: number;
}

export interface OwnerGlobalKpis {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  periodFrom: string;
  periodTo: string;
  byCountry: OwnerCountryKpi[];
}

export interface OwnerTopProduct {
  productId: number;
  productName: string;
  totalSold: number;
}

export interface OwnerCountryKpiDetail {
  countryId: number;
  countryName: string;
  currency: string;
  totalRevenue: number;
  affiliateCost: number;
  ownerSharePct: number;
  ownerRevenue: number;
  ordersByStatus: Record<string, number>;
  topProducts: OwnerTopProduct[];
  periodFrom: string;
  periodTo: string;
}

function failureResponse<T>(response: ApiResponse<unknown>): ApiResponse<T> {
  return {
    success: false,
    error: response.error,
    message: response.message,
    statusCode: response.statusCode,
  };
}

function toIsoRange(range: '24hours' | '7days' | '30days' | 'all') {
  const to = new Date();
  const from = new Date(to);

  switch (range) {
    case '24hours':
      from.setDate(from.getDate() - 1);
      break;
    case '30days':
      from.setDate(from.getDate() - 30);
      break;
    case 'all':
      from.setFullYear(from.getFullYear() - 3);
      break;
    case '7days':
    default:
      from.setDate(from.getDate() - 7);
      break;
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export class OwnerService {
  async getGlobalKpis(
    range: '24hours' | '7days' | '30days' | 'all'
  ): Promise<ApiResponse<OwnerGlobalKpis>> {
    const { from, to } = toIsoRange(range);
    const response = await apiClient.get<OwnerGlobalKpis>(
      `/api/v1/owner/kpis?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );

    if (!response.success || !response.data) {
      return failureResponse<OwnerGlobalKpis>(response);
    }

    return response;
  }

  async getCountryKpis(
    countryId: number,
    range: '24hours' | '7days' | '30days' | 'all'
  ): Promise<ApiResponse<OwnerCountryKpiDetail>> {
    const { from, to } = toIsoRange(range);
    const response = await apiClient.get<OwnerCountryKpiDetail>(
      `/api/v1/owner/kpis/${countryId}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );

    if (!response.success || !response.data) {
      return failureResponse<OwnerCountryKpiDetail>(response);
    }

    return response;
  }
}

export const ownerService = new OwnerService();
