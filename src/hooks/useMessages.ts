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

  // 标记消息为已读
  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await request.post(`/chat/conversations/${conversationId}/mark_as_read/`);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [conversationId]);

  // 获取消息历史
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const response = await request.get(
        `/chat/conversations/${conversationId}/messages/`
      );
      
      if (response.data && Array.isArray(response.data.results)) {
        setMessages(response.data.results);
        // 获取消息后立即标记为已读
        await markAsRead();
      } else {
        console.error('Invalid messages data format:', response.data);
        message.error('获取消息历史失败：数据格式错误');
      }
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      if (error.response?.status === 404) {
        message.error('无权访问该对话');
      } else {
        message.error('获取消息历史失败');
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId, markAsRead]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) return;

      try {
        if (connected) {
          // 通过 WebSocket 发送消息
          send(JSON.stringify({
            type: 'chat_message',
            message: content
          }));
        } else {
          // 作为备选方案，通过 HTTP API 发送消息
          const response = await request.post(
            `/chat/conversations/${conversationId}/messages/`,
            { content }
          );
          setMessages((prev) => [...prev, response.data]);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        message.error('发送消息失败');
      }
    },
    [conversationId, connected, send]
  );

  // 监听 WebSocket 消息
  useEffect(() => {
    const handleWebSocketMessage = (event: CustomEvent) => {
      const data = event.detail;
      
      if (data.type === 'chat_message') {
        const message = data.message;
        // 确保消息属于当前对话
        if (message && message.conversation === Number(conversationId)) {
          setMessages((prev) => {
            // 检查消息是否已经存在
            const messageExists = prev.some((m) => m.id === message.id);
            if (messageExists) {
              return prev;
            }
            // 如果是新消息，立即标记为已读
            markAsRead();
            return [...prev, message];
          });
        }
      } else if (data.type === 'messages_read') {
        // 更新消息状态为已读
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            status: 'read',
            read_at: new Date().toISOString()
          }))
        );
      }
    };

    if (conversationId) {
      window.addEventListener('ws-message', handleWebSocketMessage as EventListener);
    }

    return () => {
      if (conversationId) {
        window.removeEventListener('ws-message', handleWebSocketMessage as EventListener);
      }
    };
  }, [conversationId, markAsRead]);

  // 监听 conversationId 变化，加载消息历史
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [conversationId, fetchMessages]);

  return {
    messages,
    loading,
    sendMessage,
    refetch: fetchMessages,
  };
} 