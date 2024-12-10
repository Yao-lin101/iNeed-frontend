import { useState, useEffect, useCallback, useRef } from 'react';
import { message as antMessage } from 'antd';
import { Message } from '@/types/chat';
import { request } from '@/utils/request';
import { useWebSocket } from './useWebSocket';
import { useWebSocketMessage, MessageContext, MessagesReadData } from './useWebSocketMessage';
import { useAuthStore } from '@/store/useAuthStore';

export function useMessages(conversationId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const wsInitializedRef = useRef(false);
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);
  const { user } = useAuthStore();

  // 设置初始挂载状态
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 延迟初始化 WebSocket 连接
  const { connected, send } = useWebSocket(
    mountedRef.current && wsInitializedRef.current && conversationId 
      ? `/ws/chat/${conversationId}/` 
      : null
  );

  // 初始化 WebSocket 连��
  useEffect(() => {
    if (conversationId && mountedRef.current) {
      wsInitializedRef.current = true;
    }
    return () => {
      wsInitializedRef.current = false;
    };
  }, [conversationId]);

  // 获取消息历史
  const fetchMessages = useCallback(async () => {
    const now = Date.now();
    if (!conversationId || !mountedRef.current || fetchingRef.current || now - lastFetchRef.current < 2000) {
      return;
    }

    fetchingRef.current = true;
    lastFetchRef.current = now;
    setLoading(true);

    try {
      const response = await request.get(
        `/chat/conversations/${conversationId}/messages/`
      );
      
      if (mountedRef.current) {
        if (response.data && typeof response.data === 'object') {
          const results = response.data.results || [];
          if (Array.isArray(results)) {
            setMessages(results);
          } else {
            antMessage.error('获取消息历史失败：数据格式错误');
          }
        } else {
          antMessage.error('获取消息历史失败：响应格式错误');
        }
      }
    } catch (error: any) {
      if (mountedRef.current) {
        if (error.response?.status === 404) {
          antMessage.error('无权访问该对话');
        } else {
          antMessage.error('获取消息历史失败');
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [conversationId]);

  // 初始加载消息
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    fetchMessages();
  }, [conversationId, fetchMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !user || !mountedRef.current) return;

      let tempId = Date.now();
      const tempMessage: Message = {
        id: tempId,
        conversation: conversationId,
        content: content,
        sender: user,
        created_at: new Date().toISOString(),
        status: 'sent',
        read_at: null
      };

      try {
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
          if (mountedRef.current) {
            setMessages((prev) => prev.map(msg => 
              msg.id === tempId ? response.data : msg
            ));
          }
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        if (mountedRef.current) {
          antMessage.error('发送消息失败');
          // 发送失败时移除临时消息
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
        }
      }
    },
    [conversationId, connected, send, user]
  );

  // 处理聊天消息
  const handleChatMessage = useCallback((context: MessageContext) => {
    if (!mountedRef.current) return;
    
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
    if (!mountedRef.current) return;
    
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

  // 组件卸载时的清理
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      wsInitializedRef.current = false;
      fetchingRef.current = false;
    };
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    connected,
    refetch: fetchMessages,
  };
} 