import { useState, useCallback, useEffect, useRef } from 'react';
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
  const fetchNotificationsRef = useRef<() => Promise<void>>();

  // 检查是否在消息中心
  const isInMessageCenter = useCallback(() => {
    return location.pathname.startsWith('/mc');
  }, [location.pathname]);

  // 检查是否在系统消息标签页
  const isInSystemMessageTab = useCallback(() => {
    return location.pathname === '/mc/sm';
  }, [location.pathname]);

  // 检查是否在聊天标签页
  const isInChatTab = useCallback(() => {
    return location.pathname === '/mc/chat';
  }, [location.pathname]);


  // 更新未读消息总数
  const updateTotalUnread = useCallback((conversations: Conversation[]) => {
    const total = conversations.reduce((sum: number, conv: Conversation) => sum + (conv.unread_count || 0), 0);
    console.log('设置聊天未读总数:', total);
    setTotalUnread(total);
  }, []);

  // 获取系统通知未读数量
  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const response = await systemMessageService.getUnreadCount();
      // console.log('获取系统通知未读数量:', response.count);
      // 只有在系统消息标签页时才清零
      if (location.pathname === '/mc/sm') {
        console.log('在系统消息标签页，清零未读计数');
        setUnreadNotifications(0);
      } else {
        console.log('设置系统通知未读数量:', response.count);
        setUnreadNotifications(response.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    }
  }, [location.pathname]);

  // 保存最新的 fetchUnreadNotifications 到 ref
  useEffect(() => {
    fetchNotificationsRef.current = fetchUnreadNotifications;
  }, [fetchUnreadNotifications]);

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

    // 如果在聊天标签页，不增加未读计数
    if (isInChatTab()) {
      return;
    }

    // 如果不是当前活跃对话，加未读计数
    if (message.conversation !== activeConversationId) {
      setTotalUnread(prev => prev + 1);
    }
  }, [user?.uid, isInChatTab]);

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
    
    // 确保通知数据格式正确
    if (!data || !data.type) {
      console.warn('Invalid notification format:', data);
      return;
    }

    console.log('Processing notification:', {
      type: data.type,
      title: data.title
    });

    // 只有不在系统消息标签页时才增加未读计数
    if (!isInSystemMessageTab()) {
      setUnreadNotifications(prev => prev + 1);
      console.log('Increased local unread notifications count');
    } else {
      console.log('In system message tab, not increasing unread count');
    }
    
    // 然后异步获取服务器的准确计数
    fetchUnreadNotifications().catch(error => {
      console.error('Failed to fetch notifications count after receiving notification:', error);
    });
  }, [fetchUnreadNotifications, isInSystemMessageTab]);

  // 使用新的消息处理中心
  useWebSocketMessage({
    handleChatMessage,
    handleMessagesRead,
    handleNotification,
  });

  // 初始化和路由变化时的处理
  useEffect(() => {
    const pathname = location.pathname;
    console.log('路由变化:', pathname);
    
    const updateCounts = async () => {
      // 获取未读计数
      try {
        const response = await chatService.getConversations();
        updateTotalUnread(response.results);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }

      // 获取系统通知未读数量
      await fetchNotificationsRef.current?.();
    };

    // 立即执行更新
    updateCounts();
  }, [location.pathname, updateTotalUnread]);

  // 定期更新系统通知未读数量
  useEffect(() => {
    // 每分钟更新一次未读通知数量
    const interval = setInterval(fetchUnreadNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadNotifications]);

  // 获取总未读计数
  const getTotalUnread = useCallback(() => {
    // 如果在消息中心，总计数为0
    if (isInMessageCenter()) {
      return 0;
    }
    // 不在消息中心时，返回聊天消息和系统通知的总和
    return totalUnread + unreadNotifications;
  }, [isInMessageCenter, totalUnread, unreadNotifications]);

  return {
    totalUnread: getTotalUnread(),
    unreadMessagesCount: totalUnread,
    unreadNotifications,
    updateTotalUnread,
    updateUnreadNotifications: fetchUnreadNotifications,
  };
} 