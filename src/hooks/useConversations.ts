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

  useEffect(() => {
    fetchConversations();
  }, []);

  return {
    conversations,
    loading,
    refetch: fetchConversations,
  };
} 