import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { chatService } from '@/services/chatService';
import { useWebSocketMessage, MessageContext, MessagesReadData } from './useWebSocketMessage';
import { Conversation } from '@/types/chat';

export function useUnreadMessages() {
  const [totalUnread, setTotalUnread] = useState(0);
  const { isAuthenticated, user } = useAuthStore();

  // 更新未读消息总数
  const updateTotalUnread = useCallback((conversations: Conversation[]) => {
    const total = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    setTotalUnread(total);
  }, []);

  // 获取最新的未读消息总数
  const fetchUnreadCount = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const response = await chatService.getConversations();
        updateTotalUnread(response.results);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    }
  }, [isAuthenticated, updateTotalUnread]);

  // 处理聊天消息
  const handleChatMessage = useCallback((context: MessageContext) => {
    const { message, isInMessageCenter, activeConversationId } = context;

    // 只处理其他用户发送的消息
    if (message.sender.uid === user?.uid) {
      return;
    }

    // 如果不在消息中心，或者在消息中心但不是当前活跃对话
    if (!isInMessageCenter || message.conversation !== activeConversationId) {
      setTotalUnread(prev => prev + 1);
    }
  }, [user?.uid]);

  // 处理消息已读状态
  const handleMessagesRead = useCallback((data: MessagesReadData) => {
    const { conversation_id, unread_count } = data;
    if (!conversation_id || typeof unread_count !== 'number') return;

    // 直接使用传入的未读计数来更新总计数
    setTotalUnread(prev => Math.max(0, prev - unread_count));
  }, []);

  // 使用新的消息处理中心
  useWebSocketMessage({
    handleChatMessage,
    handleMessagesRead,
  });

  // 初始化加载
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    totalUnread,
    refetch: fetchUnreadCount,
  };
} 