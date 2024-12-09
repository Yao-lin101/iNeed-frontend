import { useState, useEffect } from 'react';
import { message } from 'antd';
import { Conversation } from '@/types/chat';
import { request } from '@/utils/request';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const response = await request.get('/chat/conversations/');
      setConversations(response.data.results);
    } catch (error) {
      message.error('获取对话列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 监听 WebSocket 消息以更新对话列表
  useEffect(() => {
    const handleWebSocketMessage = (event: CustomEvent) => {
      const data = event.detail;
      if (data.type === 'chat_message') {
        // 收到新消息时更新对话列表
        fetchConversations();
      }
    };

    window.addEventListener('ws-message', handleWebSocketMessage as EventListener);

    return () => {
      window.removeEventListener('ws-message', handleWebSocketMessage as EventListener);
    };
  }, []);

  // 初始加载
  useEffect(() => {
    fetchConversations();
  }, []);

  return {
    conversations,
    loading,
    refetch: fetchConversations,
  };
} 