/**
 * API Configuration and Base Client
 * Central configuration for all API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pme6ad6kdt.us-east-1.awsapprunner.com';
const API_TIMEOUT = 30000; // 30 seconds

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.loadToken();
  }

  private loadToken() {
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        this.token = localStorage.getItem('authToken');
      } catch (error) {
        // localStorage not available (e.g., in insecure context)
        console.warn('localStorage not available:', error);
        this.token = null;
      }
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          localStorage.setItem('authToken', token);
        } else {
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        // localStorage not available (e.g., in insecure context)
        console.warn('localStorage not available:', error);
      }
    }
  }

  private getHeaders(isFormData: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async fetchWithTimeout(
    url: string,
    init?: RequestInit,
    timeoutMs: number = this.timeout
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const isFormData = data instanceof FormData;
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(isFormData),
        body: isFormData ? data : JSON.stringify(data),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const isFormData = data instanceof FormData;
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(isFormData),
        body: isFormData ? data : JSON.stringify(data),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const isFormData = data instanceof FormData;
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(isFormData),
        body: isFormData ? data : JSON.stringify(data),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle 401 Unauthorized - logout user
      if (response.status === 401) {
        this.setToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
        }
      }

      return {
        success: false,
        error: data.error || data.message || 'An error occurred',
        statusCode: response.status,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
      statusCode: response.status,
    };
  }

  private handleError(error: any): ApiResponse<never> {
    console.error('API Error:', error);

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout. Please try again.',
      };
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}

export const apiClient = new ApiClient();
