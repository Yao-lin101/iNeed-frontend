import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWebSocketMessage, MessageContext, MessagesReadData } from './useWebSocketMessage';
import { Conversation } from '@/types/chat';
import { useLocation } from 'react-router-dom';
import { chatService } from '@/services/chatService';

export function useUnreadMessages() {
  const [totalUnread, setTotalUnread] = useState(0);
  const { user } = useAuthStore();
  const location = useLocation();

  // 检查是否在消息中心
  const isInMessageCenter = useCallback(() => {
    return location.pathname.startsWith('/mc');
  }, [location.pathname]);

  // 更新未读消息总数
  const updateTotalUnread = useCallback((conversations: Conversation[]) => {
    // 如果在消息中心，总是显示为0
    if (isInMessageCenter()) {
      setTotalUnread(0);
      return;
    }
    const total = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    setTotalUnread(total);
  }, [isInMessageCenter]);

  // 处理聊天消息
  const handleChatMessage = useCallback((context: MessageContext) => {
    const { message, activeConversationId } = context;

    // 只处理其他用户发送的消息
    if (message.sender.uid === user?.uid) {
      return;
    }

    // 如果在消息中心，不增加未读计数
    if (isInMessageCenter()) {
      return;
    }

    // 如果不是当前活跃对话，增加未读计数
    if (message.conversation !== activeConversationId) {
      setTotalUnread(prev => prev + 1);
    }
  }, [user?.uid, isInMessageCenter]);

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

  // 监听路由变化
  useEffect(() => {
    if (isInMessageCenter()) {
      setTotalUnread(0);
    } else {
      // 重新获取未读计数
      const fetchUnreadCount = async () => {
        try {
          const response = await chatService.getConversations();
          updateTotalUnread(response.results);
        } catch (error) {
          console.error('Failed to fetch unread count:', error);
        }
      };
      fetchUnreadCount();
    }
  }, [location.pathname, updateTotalUnread, isInMessageCenter]);

  return {
    totalUnread,
    updateTotalUnread,
  };
} 