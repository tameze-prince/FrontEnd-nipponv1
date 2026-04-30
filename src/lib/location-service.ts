/**
 * Location API Service
 * Aligned with `/api/v1/config/*`.
 */

import { apiClient, ApiResponse } from './api-client';

export interface Country {
  id: string;
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
  exchangeRate: number;
  isActive: boolean;
}

export interface City {
  id: string;
  name: string;
  countryId: string;
  code: string;
  region?: string;
  isActive: boolean;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  lastUpdated: string;
}

export interface WhatsappContact {
  id: string;
  cityId?: string;
  whatsappNumber: string;
  label?: string;
  active: boolean;
}

interface BackendCountry {
  id: number;
  name: string;
  code: string;
  currency?: string;
  active: boolean;
}

interface BackendCity {
  id: number;
  name: string;
  active: boolean;
}

interface BackendWhatsappContact {
  id: number;
  city?: {
    id?: number;
  };
  whatsappNumber: string;
  label?: string;
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

function mapCurrencySymbol(code?: string) {
  switch (code) {
    case 'EUR':
      return '€';
    case 'USD':
      return '$';
    case 'XOF':
    case 'XAF':
    default:
      return 'FCFA';
  }
}

function toCountry(country: BackendCountry): Country {
  return {
    id: String(country.id),
    name: country.name,
    code: country.code,
    currency: country.currency || 'XAF',
    currencySymbol: mapCurrencySymbol(country.currency),
    exchangeRate: 1,
    isActive: country.active,
  };
}

function toCity(city: BackendCity, countryId: string): City {
  return {
    id: String(city.id),
    name: city.name,
    countryId,
    code: '',
    isActive: city.active,
  };
}

function toWhatsappContact(contact: BackendWhatsappContact): WhatsappContact {
  return {
    id: String(contact.id),
    cityId: contact.city?.id ? String(contact.city.id) : undefined,
    whatsappNumber: contact.whatsappNumber,
    label: contact.label,
    active: contact.active,
  };
}

class LocationService {
  async getCountries(): Promise<ApiResponse<Country[]>> {
    const response = await apiClient.get<BackendCountry[]>('/api/v1/config/countries');

    if (!response.success || !response.data) {
      return failureResponse<Country[]>(response);
    }

    return {
      ...response,
      data: response.data.map(toCountry),
    };
  }

  async getCountry(id: string): Promise<ApiResponse<Country>> {
    const response = await this.getCountries();

    if (!response.success || !response.data) {
      return failureResponse<Country>(response);
    }

    const item = response.data.find((country) => country.id === id);
    return item
      ? { success: true, data: item }
      : { success: false, error: 'Country not found' };
  }

  async getCities(countryId: string): Promise<ApiResponse<City[]>> {
    const response = await apiClient.get<BackendCity[]>(`/api/v1/config/countries/${countryId}/cities`);

    if (!response.success || !response.data) {
      return failureResponse<City[]>(response);
    }

    return {
      ...response,
      data: response.data.map((city) => toCity(city, countryId)),
    };
  }

  async getCity(countryId: string, cityId: string): Promise<ApiResponse<City>> {
    const response = await this.getCities(countryId);

    if (!response.success || !response.data) {
      return failureResponse<City>(response);
    }

    const item = response.data.find((city) => city.id === cityId);
    return item
      ? { success: true, data: item }
      : { success: false, error: 'City not found' };
  }

  async getCurrencies(): Promise<ApiResponse<Currency[]>> {
    const countries = await this.getCountries();

    if (!countries.success || !countries.data) {
      return failureResponse<Currency[]>(countries);
    }

    const currencies = Array.from(
      new Map(
        countries.data.map((country) => [
          country.currency,
          {
            code: country.currency,
            name: country.currency,
            symbol: country.currencySymbol,
            exchangeRate: country.exchangeRate,
            lastUpdated: '',
          },
        ])
      ).values()
    );

    return {
      success: true,
      data: currencies,
    };
  }

  async getExchangeRates(): Promise<ApiResponse<Record<string, number>>> {
    const currencies = await this.getCurrencies();

    if (!currencies.success || !currencies.data) {
      return failureResponse<Record<string, number>>(currencies);
    }

    return {
      success: true,
      data: Object.fromEntries(currencies.data.map((currency) => [currency.code, currency.exchangeRate])),
    };
  }

  async getWhatsappContacts(countryId: string | number): Promise<ApiResponse<WhatsappContact[]>> {
    const response = await apiClient.get<BackendWhatsappContact[]>(
      `/api/v1/config/whatsapp?countryId=${countryId}`
    );

    if (!response.success || !response.data) {
      return failureResponse<WhatsappContact[]>(response);
    }

    return {
      ...response,
      data: response.data.map(toWhatsappContact),
    };
  }

  async createCountry(data: Partial<Country>): Promise<ApiResponse<Country>> {
    const response = await apiClient.post<BackendCountry>('/api/v1/config/countries', {
      name: data.name,
      code: data.code,
      currency: data.currency || 'XAF',
      active: data.isActive ?? true,
    });

    if (!response.success || !response.data) {
      return failureResponse<Country>(response);
    }

    return {
      ...response,
      data: toCountry(response.data),
    };
  }

  async updateCountry(id: string, data: Partial<Country>): Promise<ApiResponse<Country>> {
    if (data.isActive !== undefined) {
      const response = await apiClient.patch<BackendCountry>(
        `/api/v1/config/countries/${id}/active?active=${data.isActive}`
      );

      if (!response.success || !response.data) {
        return failureResponse<Country>(response);
      }

      return {
        ...response,
        data: toCountry(response.data),
      };
    }

    return this.getCountry(id);
  }

  async deleteCountry(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.patch<{ message: string }>(`/api/v1/config/countries/${id}/active?active=false`);
  }

  async createCity(countryId: string, data: Partial<City>): Promise<ApiResponse<City>> {
    const response = await apiClient.post<BackendCity>(
      `/api/v1/config/countries/${countryId}/cities?name=${encodeURIComponent(data.name || '')}`
    );

    if (!response.success || !response.data) {
      return failureResponse<City>(response);
    }

    return {
      ...response,
      data: toCity(response.data, countryId),
    };
  }

  async updateCity(countryId: string, cityId: string, data: Partial<City>): Promise<ApiResponse<City>> {
    if (data.isActive !== undefined) {
      const response = await apiClient.patch<BackendCity>(
        `/api/v1/config/cities/${cityId}/active?active=${data.isActive}`
      );

      if (!response.success || !response.data) {
        return failureResponse<City>(response);
      }

      return {
        ...response,
        data: toCity(response.data, countryId),
      };
    }

    return this.getCity(countryId, cityId);
  }

  async deleteCity(countryId: string, cityId: string): Promise<ApiResponse<{ message: string }>> {
    void countryId;
    return apiClient.patch<{ message: string }>(`/api/v1/config/cities/${cityId}/active?active=false`);
  }

  async updateExchangeRate(currencyCode: string, rate: number): Promise<ApiResponse<Currency>> {
    void currencyCode;
    void rate;
    return {
      success: false,
      error: 'Exchange rate updates are not implemented in the backend yet.',
    };
  }
}

export const locationService = new LocationService();
