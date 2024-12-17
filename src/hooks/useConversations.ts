import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { Conversation } from '@/types/chat';
import { request } from '@/utils/request';
import { useWebSocketMessage, MessageContext, MessagesReadData, ConversationUpdatedData } from './useWebSocketMessage';
import { useUnreadMessages } from './useUnreadMessages';
import { useAuthStore } from '@/store/useAuthStore';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const { updateTotalUnread } = useUnreadMessages();
  const { user } = useAuthStore();

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
      message.error('获取对话���败');
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
    const { message, activeConversationId, source } = context;
    
    console.log('收到消息:', {
      messageId: message.id,
      conversationId: message.conversation,
      activeConversationId,
      senderId: message.sender.uid,
      currentUserId: user?.uid,
      source
    });

    // 如果是自己发送的消息，不增加未读计数
    if (message.sender.uid === user?.uid) {
      console.log('自己发送的消息，不增加未读计数');
      return;
    }
    
    setConversations(prev => {
      const conversationIndex = prev.findIndex(c => c.id === message.conversation);
      
      if (conversationIndex === -1) {
        // 如果是新会话，触发一次获取
        if (!isFetchingRef.current) {
          console.log('新会话，触发获取');
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
        // 判断是否是活跃会话（确保 activeConversationId 不为 null）
        const isActiveConversation = activeConversationId !== null && message.conversation === activeConversationId;
        console.log('活跃会话判断:', {
          isActiveConversation,
          messageConversationId: message.conversation,
          activeConversationId,
          willIncreaseUnread: !isActiveConversation,
          source
        });
        
        // 只有在非活跃会话时才增加未读计数
        if (!isActiveConversation) {
          conversation.unread_count = (conversation.unread_count || 0) + 1;
          console.log('增加未读计数:', {
            conversationId: conversation.id,
            newUnreadCount: conversation.unread_count,
            source
          });
        }
      } else {
        console.log('chat-websocket消息，不处理未读计数');
      }
      
      // 移动到顶部
      updatedConversations.splice(conversationIndex, 1);
      updatedConversations.unshift(conversation);
      
      return updatedConversations;
    });
  }, [user?.uid, fetchConversations]);

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