import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { Conversation } from '@/types/chat';
import { request } from '@/utils/request';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await request.get('/chat/conversations/');
      setConversations(response.data.results);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      message.error('获取对话列表失败');
    } finally {
      setLoading(false);
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

  // 监听 WebSocket 消息以更新对话列表
  useEffect(() => {
    const handleWebSocketMessage = (event: CustomEvent) => {
      const data = event.detail;
      
      switch (data.type) {
        case 'chat_message':
          // 收到新消息时更新对话列表
          const message = data.message;
          if (message) {
            // 先更新现有会话中的最后一条消息
            setConversations(prev => {
              const conversationIndex = prev.findIndex(c => c.id === message.conversation);
              if (conversationIndex === -1) {
                // 如果是新会话，重新获取完整列表
                fetchConversations();
                return prev;
              }
              
              // 更新现有会话
              const updatedConversations = [...prev];
              const conversation = { ...updatedConversations[conversationIndex] };
              conversation.last_message = message;
              conversation.updated_at = new Date().toISOString();
              
              // 移动到顶部
              updatedConversations.splice(conversationIndex, 1);
              updatedConversations.unshift(conversation);
              
              return updatedConversations;
            });
          }
          break;
          
        case 'messages_read':
          // 消息被标记为已读时更新对话
          const { conversation_id } = data.message;
          if (conversation_id) {
            setConversations(prev => 
              prev.map(conv => {
                if (conv.id === conversation_id) {
                  return {
                    ...conv,
                    unread_count: 0
                  };
                }
                return conv;
              })
            );
          }
          break;
          
        case 'conversation_updated':
          // 会话状态更新
          const updatedConversation = data.conversation;
          if (updatedConversation) {
            updateConversation(updatedConversation);
          }
          break;
      }
    };

    window.addEventListener('ws-message', handleWebSocketMessage as EventListener);

    return () => {
      window.removeEventListener('ws-message', handleWebSocketMessage as EventListener);
    };
  }, [fetchConversations, updateConversation]);

  // 初始加载
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    refetch: fetchConversations,
  };
} 