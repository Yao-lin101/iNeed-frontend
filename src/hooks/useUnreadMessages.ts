import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { chatService } from '@/services/chatService';

export function useUnreadMessages() {
  const [totalUnread, setTotalUnread] = useState(0);
  const { isAuthenticated, user } = useAuthStore();

  // 更新未读消息总数
  const updateTotalUnread = (conversations: any[]) => {
    const total = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    setTotalUnread(total);
  };

  // 获取最新的未读消息总数
  const fetchUnreadCount = async () => {
    if (isAuthenticated) {
      try {
        const response = await chatService.getConversations();
        updateTotalUnread(response.results);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    }
  };

  // 初始化加载
  useEffect(() => {
    fetchUnreadCount();
  }, [isAuthenticated]);

  // 监听 WebSocket 消息
  useEffect(() => {
    const handleWebSocketMessage = (event: CustomEvent) => {
      const data = event.detail;
      
      if (data.type === 'chat_message') {
        const messageData = data.message;
        
        switch (messageData.type) {
          case 'new_message':
            // 收到新消息时，直接使用消息中的未读计数更新状态
            if (messageData.message.sender.uid !== user?.uid) {
              setTotalUnread(prev => prev + 1);
            }
            break;
            
          case 'messages_read':
            // 消息被标记为已读时更新计数
            fetchUnreadCount();
            break;
            
          case 'conversation_updated':
            // 会话状态更新时更新计数
            fetchUnreadCount();
            break;
        }
      }
    };

    window.addEventListener('ws-message', handleWebSocketMessage as EventListener);

    return () => {
      window.removeEventListener('ws-message', handleWebSocketMessage as EventListener);
    };
  }, [user?.uid]);

  return {
    totalUnread,
    refetch: fetchUnreadCount,
  };
} 