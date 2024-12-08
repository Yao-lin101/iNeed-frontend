import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { Message } from '@/types/chat';
import { request } from '@/utils/request';
import { useWebSocket } from './useWebSocket';

export function useMessages(conversationId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { connected, send } = useWebSocket(
    conversationId ? `/ws/chat/${conversationId}/` : null
  );

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const response = await request.get(
        `/chat/conversations/${conversationId}/messages/`
      );
      setMessages(response.data.results);
    } catch (error) {
      message.error('获取消息历史失败');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) return;

      try {
        if (connected) {
          // 通过 WebSocket 发送消息
          send(JSON.stringify({ message: content }));
        } else {
          // 作为备选方案，通过 HTTP API 发送消息
          const response = await request.post(
            `/chat/conversations/${conversationId}/messages/`,
            { content }
          );
          setMessages((prev) => [...prev, response.data]);
        }
      } catch (error) {
        message.error('发送消息失败');
      }
    },
    [conversationId, connected, send]
  );

  // 监听 conversationId 变化，加载消息历史
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [conversationId, fetchMessages]);

  // 标记消息为已读
  useEffect(() => {
    if (conversationId) {
      request.post(`/chat/conversations/${conversationId}/mark_read/`);
    }
  }, [conversationId]);

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages,
  };
} 