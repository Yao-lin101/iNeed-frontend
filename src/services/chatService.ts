import { request } from '@/utils/request';

export const chatService = {
  /** 获取对话列表 */
  getConversations: async () => {
    const response = await request.get('/api/chat/conversations/');
    return response.data;
  },

  /** 获取单个对话 */
  getConversation: async (conversationId: number) => {
    const response = await request.get(`/api/chat/conversations/${conversationId}/`);
    return response.data;
  },

  /** 创建新对话 */
  createConversation: async (recipientUid: string) => {
    try {
      const response = await request.post('/api/chat/conversations/', {
        recipient_uid: recipientUid
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  /** 发送消息 */
  sendMessage: async (conversationId: number, content: string) => {
    const response = await request.post(`/api/chat/conversations/${conversationId}/messages/`, { content });
    return response.data;
  },

  /** 标记消息为已读 */
  markAsRead: async (conversationId: number) => {
    try {
      const response = await request.post(`/api/chat/conversations/${conversationId}/mark_as_read/`);
      return response.data;
    } catch (error) {
      console.error('标记已读失败:', error);
      // 可以添加重试逻辑
      throw error;
    }
  },

  /** 删除对话 */
  deleteConversation: async (conversationId: number) => {
    const response = await request.post(`/api/chat/conversations/${conversationId}/delete-for-user/`);
    return response.data;
  },

  /** 检查是否有新消息 */
  hasNewMessages: async (conversationId: number) => {
    const response = await request.get(`/api/chat/conversations/${conversationId}/has_new_messages/`);
    return response.data.hasNewMessages;
  },

  /** 清理消息 */
  cleanMessages: async (conversationId: number) => {
    const response = await request.post(`/api/chat/conversations/${conversationId}/clean_messages/`);
    return response.data;
  },

  /** 获取历史消息（分页） */
  getHistoryMessages: async (
    conversationId: number,
    page: number = 1,
    pageSize: number = 20
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString()
    });
    
    const response = await request.get(
      `/api/chat/conversations/${conversationId}/history_messages/?${params}`
    );
    return response.data;
  },

  /** 同步新消息 */
  syncMessages: async (
    conversationId: number,
    lastSyncTime: string
  ) => {
    const params = new URLSearchParams({
      last_sync_time: lastSyncTime
    });
    
    const response = await request.get(
      `/api/chat/conversations/${conversationId}/sync_messages/?${params}`
    );
    return response.data;
  },
}; 