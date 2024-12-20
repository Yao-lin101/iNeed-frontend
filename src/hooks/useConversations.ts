import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { Conversation } from '@/types/chat';
import { request } from '@/utils/request';
import { useWebSocketMessage, MessageContext, MessagesReadData, ConversationUpdatedData } from './useWebSocketMessage';
import { useUnreadStore } from '@/store/useUnreadStore';
import { useAuthStore } from '@/store/useAuthStore';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const { setUnreadMessages } = useUnreadStore();
  const { user } = useAuthStore();

  // 获取会话列表
  const fetchConversations = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    try {
      setLoading(true);
      const response = await request.get('/api/chat/conversations/');
      setConversations(response.data?.results || []);
      
      // 使用新的 store 方法更新未读数
      const unreadCount = (response.data?.results || []).reduce(
        (sum: number, conv: Conversation) => sum + (conv.unread_count || 0), 
        0
      );
      setUnreadMessages(unreadCount);
      
      return response;
    } catch (error) {
      console.error('[useConversations] Failed to fetch:', error);
      message.error('获取对话失败');
      // 设置空数组作为默认值
      setConversations([]);
      setUnreadMessages(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [setUnreadMessages]);

  // 更新单个会话
  const updateConversation = useCallback((updatedConversation: Conversation) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === updatedConversation.id ? updatedConversation : conv
      )
    );
  }, []);

  // 只更新本地会话的未读状态
  const updateLocalUnreadCount = useCallback((conversationId: number, count: number) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, unread_count: count } : conv
    ));
  }, []);

  // 更新全局未读数（包括本��状态）
  const updateUnreadCount = useCallback((conversationId: number, count: number) => {
    // 更新本地状态
    setConversations(prev => {
      const updatedConversations = prev.map(conv => 
        conv.id === conversationId ? { ...conv, unread_count: count } : conv
      );
      
      // 计算新的总未读数
      const totalUnread = updatedConversations.reduce(
        (sum, conv) => sum + (conv.unread_count || 0),
        0
      );
      
      // 更新全局未读数
      setUnreadMessages(totalUnread);
      
      return updatedConversations;
    });
  }, [setUnreadMessages]);

  // 处理聊天消息
  const handleChatMessage = useCallback((context: MessageContext) => {
    const { message, activeConversationId, source } = context;

    // 如果是自己发送的消息，不增加未读计数
    if (message.sender.uid === user?.uid) {
      return;
    }
    
    setConversations(prev => {
      const conversationIndex = prev.findIndex(c => c.id === message.conversation);
      
      if (conversationIndex === -1) {
        // 如果是新会话，触发一次获取
        if (!isFetchingRef.current) {
          fetchConversations();
        }
        return prev;
      }
      
      // 更新现有会话
      const updatedConversations = [...prev];
      const conversation = { ...updatedConversations[conversationIndex] };
      
      // 更新最后一条消息
      conversation.last_message = message;
      conversation.updated_at = new Date().toISOString();
      
      // 只有来自 user-websocket 的消息才处理未读计数
      if (source === 'user-websocket') {
        // 判断是否是活跃会话
        const isActiveConversation = activeConversationId !== null && message.conversation === activeConversationId;
        
        // 只有在非活跃会话时才增加未读计数
        if (!isActiveConversation) {
          conversation.unread_count = (conversation.unread_count || 0) + 1;
        }
      }
      
      // 移动到顶部
      updatedConversations.splice(conversationIndex, 1);
      updatedConversations.unshift(conversation);
      
      return updatedConversations;
    });
  }, [user?.uid, fetchConversations, setUnreadMessages]);

  // 处理消息已读状态
  const handleMessagesRead = useCallback((data: MessagesReadData) => {
    const { conversation_id } = data;
    if (!conversation_id) return;
    updateUnreadCount(conversation_id, 0);
  }, [updateUnreadCount]);

  // 处理会话更新
  const handleConversationUpdated = useCallback((data: ConversationUpdatedData) => {
    const { conversation } = data;
    if (conversation) {
      updateConversation(conversation);
    }
  }, [updateConversation]);

  // 使用新的消息处理中心
  useWebSocketMessage({
    handleChatMessage,
    handleMessagesRead,
    handleConversationUpdated,
  });

  // 初始加载
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    refetch: fetchConversations,
    updateUnreadCount,
    updateLocalUnreadCount,
    handleMessagesRead,
  };
} 