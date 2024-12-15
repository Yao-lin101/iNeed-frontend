import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { Conversation } from '@/types/chat';
import { request } from '@/utils/request';
import { useWebSocketMessage, MessageContext, MessagesReadData, ConversationUpdatedData } from './useWebSocketMessage';
import { useUnreadMessages } from './useUnreadMessages';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const { updateTotalUnread } = useUnreadMessages();

  // 获取会话列表
  const fetchConversations = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    try {
      const response = await request.get('/chat/conversations/');
      setConversations(response.data.results);
      updateTotalUnread(response.data.results);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      message.error('获取对话列表失败');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [updateTotalUnread]);

  // 更新单个会话
  const updateConversation = useCallback((updatedConversation: Conversation) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === updatedConversation.id ? updatedConversation : conv
      )
    );
  }, []);

  // 更新会话的未读计数
  const updateUnreadCount = useCallback((conversationId: number, count: number) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId
          ? { ...conv, unread_count: count }
          : conv
      )
    );
  }, []);

  // 处理聊天消息
  const handleChatMessage = useCallback((context: MessageContext) => {
    const { message, isInMessageCenter, activeConversationId } = context;
    
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
      
      // 检查是否需要增加未读计数
      // 1. 如果消息属于当前活跃的会话，不增加计数
      // 2. 如果在消息中心且有活跃会话，不增加计数（处理聊天弹窗的情况）
      const isActiveConversation = message.conversation === activeConversationId;
      const hasActiveConversation = activeConversationId !== null;
      const shouldIncreaseUnread = !isActiveConversation && !(isInMessageCenter && hasActiveConversation);
      
      if (shouldIncreaseUnread) {
        conversation.unread_count = (conversation.unread_count || 0) + 1;
      }
      
      // 移动到顶部
      updatedConversations.splice(conversationIndex, 1);
      updatedConversations.unshift(conversation);
      
      return updatedConversations;
    });
  }, [fetchConversations]);

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
    handleMessagesRead,
  };
} 