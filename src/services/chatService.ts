import { request } from '@/utils/request';

export const chatService = {
  /** 获取对话列表 */
  getConversations: async () => {
    const response = await request.get('/chat/conversations/');
    return response.data;
  },

  /** 获取单个对话 */
  getConversation: async (conversationId: number) => {
    const response = await request.get(`/chat/conversations/${conversationId}/`);
    return response.data;
  },

  /** 创建新对话 */
  createConversation: async (recipientUid: string) => {
    const response = await request.post('/chat/conversations/', { recipient_uid: recipientUid });
    return response.data;
  },

  /** 获取对话消息 */
  getMessages: async (conversationId: number) => {
    const response = await request.get(`/chat/conversations/${conversationId}/messages/`);
    return response.data;
  },

  /** 发送消息 */
  sendMessage: async (conversationId: number, content: string) => {
    const response = await request.post(`/chat/conversations/${conversationId}/messages/`, { content });
    return response.data;
  },

  /** 标记消息为已读 */
  markAsRead: async (conversationId: number) => {
    const response = await request.post(`/chat/conversations/${conversationId}/mark_as_read/`);
    return response.data;
  },

  /** 删除对话 */
  deleteConversation: async (conversationId: number) => {
    const response = await request.post(`/chat/conversations/${conversationId}/delete-for-user/`);
    return response.data;
  },

  /** 检查是否有新消息 */
  hasNewMessages: async (conversationId: number) => {
    const response = await request.get(`/chat/conversations/${conversationId}/has_new_messages/`);
    return response.data.hasNewMessages;
  },

  /** 清理消息 */
  cleanMessages: async (conversationId: number) => {
    const response = await request.post(`/chat/conversations/${conversationId}/clean_messages/`);
    return response.data;
  }
}; 