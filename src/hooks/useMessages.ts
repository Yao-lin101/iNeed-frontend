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
      console.log('Fetching messages for conversation:', conversationId);
      const response = await request.get(
        `/chat/conversations/${conversationId}/messages/`
      );
      console.log('Fetched messages:', response.data);
      
      if (response.data && Array.isArray(response.data.results)) {
        setMessages(response.data.results);
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
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) return;

      try {
        if (connected) {
          // 通过 WebSocket 发送消息
          console.log('Sending message via WebSocket:', content);
          send(JSON.stringify({ message: content }));
          // 不需要立即更新消息列表，等待 WebSocket 的响应
        } else {
          // 作为备选方案，通过 HTTP API 发送消息
          console.log('Sending message via HTTP:', content);
          const response = await request.post(
            `/chat/conversations/${conversationId}/messages/`,
            { content }
          );
          console.log('Message sent successfully:', response.data);
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
      const message = event.detail;
      console.log('Received WebSocket message in useMessages:', message);
      
      // 确保消息属于当前对话
      if (message && message.conversation === Number(conversationId)) {
        setMessages((prev) => {
          // 检查消息是否已经存在
          const messageExists = prev.some((m) => m.id === message.id);
          if (messageExists) {
            console.log('Message already exists:', message);
            return prev;
          }
          console.log('Adding new message to list:', message);
          return [...prev, message];
        });
      } else {
        console.log('Message belongs to different conversation or invalid format:', message);
      }
    };

    if (conversationId) {
      console.log('Setting up WebSocket message listener for conversation:', conversationId);
      window.addEventListener('ws-message', handleWebSocketMessage as EventListener);
    }

    return () => {
      if (conversationId) {
        console.log('Removing WebSocket message listener for conversation:', conversationId);
        window.removeEventListener('ws-message', handleWebSocketMessage as EventListener);
      }
    };
  }, [conversationId]);

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