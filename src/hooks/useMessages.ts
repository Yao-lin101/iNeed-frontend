import { useState, useEffect, useCallback } from 'react';
import { message as antMessage } from 'antd';
import { Message } from '@/types/chat';
import { request } from '@/utils/request';
import { useWebSocket } from './useWebSocket';
import { useWebSocketMessage, MessageContext, MessagesReadData } from './useWebSocketMessage';
import { useAuthStore } from '@/store/useAuthStore';

export function useMessages(conversationId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { connected, send } = useWebSocket(
    conversationId ? `/ws/chat/${conversationId}/` : null
  );
  const { user } = useAuthStore();

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
      } else {
        console.error('Invalid messages data format:', response.data);
        antMessage.error('获取消息历史失败：数据格式错误');
      }
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      if (error.response?.status === 404) {
        antMessage.error('无权访问该对话');
      } else {
        antMessage.error('获取消息历史失败');
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !user) return;

      try {
        // 创建临时消息
        const tempMessage: Message = {
          id: Date.now(),
          conversation: conversationId,
          content: content,
          sender: user,
          created_at: new Date().toISOString(),
          status: 'sent',
          read_at: null
        };

        // 立即添加临时消息到本地状态
        setMessages(prev => [...prev, tempMessage]);

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
          // 用服务器返回的消息替换临时消息
          setMessages((prev) => prev.map(msg => 
            (msg.id === tempMessage.id) ? response.data : msg
          ));
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        antMessage.error('发送消息失败');
        // 发送失败时移除临时消息
        setMessages(prev => prev.filter(msg => msg.id !== Date.now()));
      }
    },
    [conversationId, connected, send, user]
  );

  // 处理聊天消息
  const handleChatMessage = useCallback((context: MessageContext) => {
    const { message } = context;
    
    // 确保消息属于当前对话
    if (message && message.conversation === conversationId) {
      setMessages((prev) => {
        // 检查消息是否已经存在（包括临时消息）
        const messageExists = prev.some((m) => 
          m.id === message.id || 
          (m.content === message.content && 
           m.sender.uid === message.sender.uid && 
           Math.abs(new Date(m.created_at).getTime() - new Date(message.created_at).getTime()) < 5000)
        );
        if (messageExists) {
          // 如果存在临时消息，用服务器返回的消息替换它
          return prev.map(m => 
            (m.content === message.content && 
             m.sender.uid === message.sender.uid && 
             Math.abs(new Date(m.created_at).getTime() - new Date(message.created_at).getTime()) < 5000)
            ? message
            : m
          );
        }
        return [...prev, message];
      });
    }
  }, [conversationId]);

  // 处理消息已读状态
  const handleMessagesRead = useCallback((data: MessagesReadData) => {
    const { conversation_id } = data;
    if (conversation_id !== conversationId) return;

    // 更新消息状态为已读
    setMessages(prev =>
      prev.map(msg => ({
        ...msg,
        status: 'read',
        read_at: new Date().toISOString()
      }))
    );
  }, [conversationId]);

  // 使用新的消息处理中心
  useWebSocketMessage({
    handleChatMessage,
    handleMessagesRead,
  });

  // 初始加载消息
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
    connected,
  };
} 