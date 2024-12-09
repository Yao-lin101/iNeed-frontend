import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { Conversation } from '@/types/chat';
import { request } from '@/utils/request';
import { useWebSocketMessage, MessageContext, MessagesReadData, ConversationUpdatedData } from './useWebSocketMessage';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  // 获取会话列表
  const fetchConversations = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    try {
      const response = await request.get('/chat/conversations/');
      setConversations(response.data.results);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      message.error('获取对话列表失败');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

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
      
      // 更新未读计数（如果不是当前活跃对话）
      if (!isInMessageCenter || message.conversation !== activeConversationId) {
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