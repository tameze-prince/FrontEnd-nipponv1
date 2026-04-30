/**
 * Orders API Service
 * Handles all order-related API calls (from cart to checkout to orders)
 * Mapped from: POST /api/v1/orders, GET /api/v1/orders/my-orders, etc.
 */

import { apiClient, ApiResponse, PaginatedResponse } from './api-client';

export interface OrderItem {
  id: string;
  variantId: string;
  productName: string;
  variantLabel?: string;
  variantColor?: string;
  variantSize?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  orderType?: string;
  items: OrderItem[];
  cityId?: number;
  city?: { id?: number; name: string };
  cityName?: string;
  countryName?: string;
  subtotal: number;
  shippingCost: number;
  pointsUsed?: number;
  pointsDiscount?: number;
  totalAmount: number;
  invoiceUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string;
}

export interface OrderRequest {
  cityId: number;
  items: Array<{ variantId: string; quantity: number }>;
  pointsToUse?: number;
  notes?: string;
}

// Cart management interfaces (for local cart use, not backend API)
export interface CartItem {
  variantId: string;
  productName: string;
  variantColor?: string;
  variantSize?: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  total: number;
}

type PlaceholderResponse = Record<string, never>;

interface BackendOrderItemResponse {
  variantId: number;
  productName: string;
  variantLabel?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface BackendOrderResponse {
  id: number;
  status: Order['status'];
  orderType?: string;
  cityName?: string;
  countryName?: string;
  subtotal: number;
  discountAmount?: number;
  totalAmount: number;
  pointsUsed?: number;
  items: BackendOrderItemResponse[];
  invoiceUrl?: string;
  createdAt: string;
  deliveredAt?: string;
}

interface BackendOrderPage {
  content: BackendOrderResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

function failureResponse<T>(response: ApiResponse<unknown>): ApiResponse<T> {
  return {
    success: false,
    error: response.error,
    message: response.message,
    statusCode: response.statusCode,
  };
}

function asNumber(value: number | string | undefined | null): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function buildOrderNumber(id: string | number) {
  return `ORD-${String(id).padStart(6, '0')}`;
}

function mapOrderItem(item: BackendOrderItemResponse): OrderItem {
  return {
    id: String(item.variantId),
    variantId: String(item.variantId),
    productName: item.productName || 'Produit NipponHub',
    variantLabel: item.variantLabel,
    quantity: item.quantity,
    unitPrice: asNumber(item.unitPrice),
    subtotal: asNumber(item.totalPrice),
  };
}

function mapOrder(order: BackendOrderResponse): Order {
  const id = String(order.id);

  return {
    id,
    userId: '',
    orderNumber: buildOrderNumber(id),
    status: order.status,
    orderType: order.orderType,
    items: (order.items || []).map(mapOrderItem),
    cityId: undefined,
    city: order.cityName ? { name: order.cityName } : undefined,
    cityName: order.cityName,
    countryName: order.countryName,
    subtotal: asNumber(order.subtotal),
    shippingCost: 0,
    pointsUsed: order.pointsUsed || 0,
    pointsDiscount: asNumber(order.discountAmount),
    totalAmount: asNumber(order.totalAmount),
    invoiceUrl: order.invoiceUrl,
    createdAt: order.createdAt,
    updatedAt: order.deliveredAt || order.createdAt,
    deliveredAt: order.deliveredAt,
  };
}

function mapPage(page: BackendOrderPage): PaginatedResponse<Order> {
  return {
    data: (page.content || []).map(mapOrder),
    pagination: {
      page: (page.number || 0) + 1,
      pageSize: page.size || page.content.length,
      total: page.totalElements || page.content.length,
      totalPages: page.totalPages || 1,
    },
  };
}

class OrderService {
  /**
   * Create order (place new order)
   * Mapped from: POST /api/v1/orders
   */
  async createOrder(data: OrderRequest): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<BackendOrderResponse>('/api/v1/orders', data);

    if (!response.success || !response.data) {
      return failureResponse<Order>(response);
    }

    return {
      ...response,
      data: mapOrder(response.data),
    };
  }

  /**
   * Get my orders (user's orders)
   * Mapped from: GET /api/v1/orders/my-orders
   */
  async getMyOrders(
    page: number = 0,
    pageSize: number = 10
  ): Promise<ApiResponse<PaginatedResponse<Order>>> {
    const response = await apiClient.get<BackendOrderPage>(
      `/api/v1/orders/my-orders?page=${page}&size=${pageSize}`
    );

    if (!response.success || !response.data) {
      return failureResponse<PaginatedResponse<Order>>(response);
    }

    return {
      ...response,
      data: mapPage(response.data),
    };
  }

  /**
   * Get single order details (user's own order)
   * Mapped from: GET /api/v1/orders/my-orders/{id}
   */
  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.get<BackendOrderResponse>(`/api/v1/orders/my-orders/${orderId}`);

    if (!response.success || !response.data) {
      return failureResponse<Order>(response);
    }

    return {
      ...response,
      data: mapOrder(response.data),
    };
  }

  /**
   * Cancel order (user can cancel their own pending order)
   * Note: Not directly exposed - use updateOrderStatus with CANCELLED
   * TODO: Verify if cancellation is allowed from frontend or needs backend endpoint
   */
  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    console.warn('Order cancellation needs verification - no dedicated endpoint in API_DOCUMENTATION');
    void reason;
    // Try to update status to CANCELLED as fallback
    return apiClient.patch<{ message: string }>(`/api/v1/orders/${orderId}/status?status=CANCELLED`);
  }

  /**
   * Get all orders (ADMIN/OWNER only)
   * Mapped from: GET /api/v1/orders
   */
  async getAllOrders(
    countryId?: number,
    page: number = 0,
    pageSize: number = 20,
    status?: string
  ): Promise<ApiResponse<PaginatedResponse<Order>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: pageSize.toString(),
      ...(status && { status }),
    });

    if (countryId !== undefined) {
      params.set('countryId', countryId.toString());
    }

    const response = await apiClient.get<BackendOrderPage>(`/api/v1/orders?${params.toString()}`);

    if (!response.success || !response.data) {
      return failureResponse<PaginatedResponse<Order>>(response);
    }

    return {
      ...response,
      data: mapPage(response.data),
    };
  }

  /**
   * Get order details (ADMIN/OWNER only)
   * Mapped from: GET /api/v1/orders/{id}
   */
  async getOrderAdmin(orderId: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.get<BackendOrderResponse>(`/api/v1/orders/${orderId}`);

    if (!response.success || !response.data) {
      return failureResponse<Order>(response);
    }

    return {
      ...response,
      data: mapOrder(response.data),
    };
  }

  /**
   * Update order status (ADMIN/OWNER only)
   * Mapped from: PATCH /api/v1/orders/{id}/status
   */
  async updateOrderStatus(
    orderId: string,
    status: Order['status']
  ): Promise<ApiResponse<Order>> {
    const response = await apiClient.patch<BackendOrderResponse>(
      `/api/v1/orders/${orderId}/status?status=${status}`
    );

    if (!response.success || !response.data) {
      return failureResponse<Order>(response);
    }

    return {
      ...response,
      data: mapOrder(response.data),
    };
  }

  /**
   * Create POS sale (Point of Sale - counter sale, ADMIN/OWNER only)
   * Mapped from: POST /api/v1/orders/pos
   */
  async createPOSSale(data: {
    items: Array<{ variantId: string; quantity: number }>;
    customerName: string;
    customerPhone: string;
    paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY';
    notes?: string;
  }): Promise<ApiResponse<Order>> {
    const response = await apiClient.post<BackendOrderResponse>('/api/v1/orders/pos', data);

    if (!response.success || !response.data) {
      return failureResponse<Order>(response);
    }

    return {
      ...response,
      data: mapOrder(response.data),
    };
  }

  // Cart management methods (client-side only, no backend cart service)
  /**
   * Get user's local cart (client-side only)
   * Note: No backend cart endpoint in API_DOCUMENTATION
   * Cart is managed locally in useCartStore
   */
  async getCart(): Promise<ApiResponse<Cart>> {
    console.warn('getCart is client-side only - use useCartStore instead');
    return {
      success: false,
      error: 'Cart is managed client-side. Use useCartStore hook.',
    };
  }

  /**
   * Add item to cart (client-side only)
   */
  async addToCart(_data: unknown): Promise<ApiResponse<Cart>> {
    console.warn('addToCart is client-side only - use useCartStore instead');
    return {
      success: false,
      error: 'Cart is managed client-side. Use useCartStore hook.',
    };
  }

  /**
   * Update cart item (client-side only)
   */
  async updateCartItem(_variantId: string, _quantity: number): Promise<ApiResponse<Cart>> {
    console.warn('updateCartItem is client-side only - use useCartStore instead');
    return {
      success: false,
      error: 'Cart is managed client-side. Use useCartStore hook.',
    };
  }

  /**
   * Remove from cart (client-side only)
   */
  async removeFromCart(_variantId: string): Promise<ApiResponse<Cart>> {
    console.warn('removeFromCart is client-side only - use useCartStore instead');
    return {
      success: false,
      error: 'Cart is managed client-side. Use useCartStore hook.',
    };
  }

  /**
   * Clear cart (client-side only)
   */
  async clearCart(): Promise<ApiResponse<{ message: string }>> {
    console.warn('clearCart is client-side only - use useCartStore instead');
    return {
      success: false,
      error: 'Cart is managed client-side. Use useCartStore hook.',
    };
  }

  // Coupon management (not in API_DOCUMENTATION)
  /**
   * Apply coupon code to cart
   * Note: Not exposed in API_DOCUMENTATION
   * TODO: Verify if coupon support is planned or if it's handled via order notes
   */
  async applyCoupon(_code: string): Promise<ApiResponse<PlaceholderResponse>> {
    console.warn('Coupon system not documented in backend API');
    return {
      success: false,
      error: 'Coupon system not yet available',
    };
  }

  /**
   * Validate coupon code
   * Note: Not exposed in API_DOCUMENTATION
   */
  async validateCoupon(_code: string): Promise<ApiResponse<PlaceholderResponse>> {
    console.warn('Coupon system not documented in backend API');
    return {
      success: false,
      error: 'Coupon system not yet available',
    };
  }

  /**
   * Get order by order number
   * Note: Not exposed in API_DOCUMENTATION
   * TODO: Add endpoint if needed
   */
  async getOrderByNumber(_orderNumber: string): Promise<ApiResponse<Order>> {
    console.warn('getOrderByNumber not in API_DOCUMENTATION');
    return {
      success: false,
      error: 'Order lookup by number not yet available',
    };
  }

  /**
   * Process payment
   * Note: Not exposed in API_DOCUMENTATION
   * TODO: Confirm payment processing flow
   */
  async processPayment(
    _orderId: string,
    _data: unknown
  ): Promise<ApiResponse<PlaceholderResponse>> {
    console.warn('Payment processing not documented in API_DOCUMENTATION');
    return {
      success: false,
      error: 'Payment processing not yet available',
    };
  }
}

export const orderService = new OrderService();
