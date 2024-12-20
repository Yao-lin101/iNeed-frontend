import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWebSocketMessage, MessageContext, MessagesReadData } from './useWebSocketMessage';
import { useUnreadStore } from '@/store/useUnreadStore';

export function useUnreadMessages() {
  const { user } = useAuthStore();
  const { 
    incrementUnreadMessages,
    decrementUnreadMessages,
    incrementUnreadNotifications,
    syncUnreadCounts
  } = useUnreadStore();

  // 处理聊天消息
  const handleChatMessage = useCallback((context: MessageContext) => {
    const { message, activeConversationId } = context;
    
    if (!message || !message.sender) return;
    if (message.sender.uid === user?.uid) return;
    
    // 只有在非活跃会话时才增加未读计数
    const isActiveConversation = activeConversationId !== null && 
      message.conversation === activeConversationId;
    
    if (!isActiveConversation) {
      incrementUnreadMessages();
    }
  }, [user?.uid, incrementUnreadMessages]);

  // 处理消息已读状态
  const handleMessagesRead = useCallback((data: MessagesReadData) => {
    const { conversation_id, unread_count } = data;
    if (!conversation_id || typeof unread_count !== 'number') return;
    decrementUnreadMessages(unread_count);
  }, [decrementUnreadMessages]);

  // 处理系统通知
  const handleNotification = useCallback((data: any) => {
    if (!data || !data.type) return;
    incrementUnreadNotifications();
  }, [incrementUnreadNotifications]);

  useWebSocketMessage({
    handleChatMessage,
    handleMessagesRead,
    handleNotification,
  });

  // 初始化同步
  useEffect(() => {
    if (user?.uid) {
      syncUnreadCounts();
    }
  }, [user?.uid, syncUnreadCounts]);

  // 返回空对象，因为状态已经移到 store 中
  return {};
} 