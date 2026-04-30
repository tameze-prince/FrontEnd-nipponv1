'use client';

import React, { useEffect, useState } from 'react';
import { Bell, X, Check, Clock } from 'lucide-react';
import { notificationService, type Notification } from '@/lib/index';
import { useAuthStore } from '@/stores/useAuthStore';

export function NotificationBell() {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Charger les notifications au montage
    void loadNotifications();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(() => {
      void loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      // Charger le compte des non-lues
      const countResponse = await notificationService.getUnreadCount();
      if (countResponse.success && countResponse.data !== undefined) {
        setUnreadCount(countResponse.data);
      }

      // Charger les 10 dernières notifications
      const response = await notificationService.getNotifications(1, 10);
      if (response.success && response.data?.content) {
        setNotifications(response.data.content);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.actionUrl) return notification.actionUrl;
    if (notification.relatedOrderId) return `/admin/orders/${notification.relatedOrderId}`;
    if (notification.relatedProductId) return `/admin/products/${notification.relatedProductId}`;
    return null;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
        <Bell className="w-6 h-6" />
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Tout marquer comme lu
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="inline-block animate-spin">
                  <div className="w-6 h-6 border-3 border-gray-300 border-t-blue-600 rounded-full" />
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const link = getNotificationLink(notification);
                  const content = (
                    <div
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          void handleMarkAsRead(notification.id);
                        }
                        if (link) {
                          window.location.href = link;
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatTime(notification.createdAt)}
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  );

                  return <div key={notification.id}>{content}</div>;
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 p-3 text-center">
              <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Close on outside click */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
