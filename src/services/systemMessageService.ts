import api from './api';

export interface SystemNotification {
  id: number;
  type: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface SystemNotificationResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SystemNotification[];
}

export const systemMessageService = {
  getNotifications: async (params?: { page?: number }) => {
    const response = await api.get('/chat/notifications/', { params });
    return response.data as SystemNotificationResponse;
  },

  getUnreadCount: async () => {
    const response = await api.get('/chat/notifications/unread_count/');
    return response.data as { count: number };
  },

  sendNotification: async (data: {
    recipient_uid: string;
    type: string;
    title: string;
    content: string;
    metadata: Record<string, any>;
  }) => {
    const response = await api.post('/chat/notifications/', data);
    return response.data;
  },

  markAsRead: async (notificationId: number) => {
    const response = await api.post(`/chat/notifications/${notificationId}/read/`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/chat/notifications/mark-all-read/');
    return response.data;
  }
}; 