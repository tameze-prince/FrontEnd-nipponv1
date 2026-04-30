import { apiClient, ApiResponse } from './api-client';

export interface Notification {
  id: string;
  type: 'NEW_ORDER' | 'NEW_USER' | 'ORDER_STATUS_CHANGE' | 'PRODUCT_REVIEW' | 'FLASH_SALE_CREATED' | 'LOW_STOCK';
  title: string;
  message: string;
  read: boolean;
  relatedOrderId?: number;
  relatedProductId?: number;
  relatedUserId?: number;
  actionUrl?: string;
  createdAt: string;
}

interface NotificationResponse {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

class NotificationService {
  async getNotifications(page: number = 1, pageSize: number = 20): Promise<ApiResponse<NotificationResponse>> {
    const response = await apiClient.get<NotificationResponse>(
      `/api/v1/notifications?page=${page - 1}&size=${pageSize}`
    );
    return response;
  }

  async getUnreadCount(): Promise<ApiResponse<number>> {
    const response = await apiClient.get<number>('/api/v1/notifications/unread/count');
    return response;
  }

  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    const response = await apiClient.put<Notification>(
      `/api/v1/notifications/${notificationId}/read`,
      {}
    );
    return response;
  }

  async markAllAsRead(): Promise<ApiResponse<void>> {
    const response = await apiClient.put<void>('/api/v1/notifications/read-all', {});
    return response;
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/api/v1/notifications/${notificationId}`);
    return response;
  }
}

export const notificationService = new NotificationService();
