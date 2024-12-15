import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWebSocketMessage, MessageContext, MessagesReadData } from './useWebSocketMessage';
import { Conversation } from '@/types/chat';
import { useLocation } from 'react-router-dom';
import { chatService } from '@/services/chatService';
import { systemMessageService } from '@/services/systemMessageService';

export function useUnreadMessages() {
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { user } = useAuthStore();
  const location = useLocation();

  // 检查是否在消息中心
  const isInMessageCenter = useCallback(() => {
    return location.pathname.startsWith('/mc');
  }, [location.pathname]);

  // 检查是否有活跃会话
  const hasActiveConversation = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.has('conversation');
  }, [location.search]);

  // 更新未读消息总数
  const updateTotalUnread = useCallback((conversations: Conversation[]) => {
    // 如果在消息中心，不计算聊天消息的未读数
    if (isInMessageCenter()) {
      setTotalUnread(0);
      return;
    }
    const total = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    setTotalUnread(total);
  }, [isInMessageCenter, hasActiveConversation]);

  // 获取系统通知未读数量
  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const response = await systemMessageService.getUnreadCount();
      // 如果在消息中心，不计入未读数
      if (isInMessageCenter()) {
        setUnreadNotifications(0);
      } else {
        setUnreadNotifications(response.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    }
  }, [isInMessageCenter]);

  // 处理聊天消息
  const handleChatMessage = useCallback((context: MessageContext) => {
    const { message, activeConversationId } = context;
    
    // 确保消息和发送者存在
    if (!message || !message.sender) {
      console.warn('Invalid message format:', message);
      return;
    }

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

  // 处理系统通知
  const handleNotification = useCallback((data: any) => {
    console.log('Received notification data:', data);
    
    // 如果在消息中心，不增加未读计数
    if (isInMessageCenter()) {
      console.log('In message center, setting count to 0');
      setUnreadNotifications(0);
      return;
    }

    // 确保消息格式正确
    const message = data.message;
    if (!message) {
      console.warn('Invalid notification format:', data);
      return;
    }

    console.log('Processing notification message:', message);

    // 使用消息中的未读计数
    if (message.unread_count !== undefined) {
      console.log('Updating unread notifications count to:', message.unread_count);
      setUnreadNotifications(message.unread_count);
    } else {
      console.warn('No unread_count in notification message:', message);
    }
  }, [isInMessageCenter]);

  // 使用新的消息处理中心
  useWebSocketMessage({
    handleChatMessage,
    handleMessagesRead,
    handleNotification,
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

    // 重新获取系统通知未读数量
    fetchUnreadNotifications();
  }, [location.pathname, updateTotalUnread, isInMessageCenter, fetchUnreadNotifications]);

  // 初始化和定期更新系统通知未读数量
  useEffect(() => {
    fetchUnreadNotifications();
    
    // 每分钟更新一次未读通知数量
    const interval = setInterval(fetchUnreadNotifications, 60000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadNotifications]);

  return {
    totalUnread: totalUnread + unreadNotifications,
    updateTotalUnread,
    updateUnreadNotifications: fetchUnreadNotifications,
  };
} 