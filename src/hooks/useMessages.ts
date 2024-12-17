import { useState, useCallback, useEffect, useRef } from 'react';
import { message as antMessage } from 'antd';
import { chatService } from '@/services/chatService';
import { useMessageStore } from '@/store/messageStore';
import { Message } from '@/types/chat';
import { useWebSocket } from './useWebSocket';
import { useWebSocketMessage, MessageContext } from './useWebSocketMessage';

export const useMessages = (conversationId: number | null) => {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const prevConversationIdRef = useRef<number | null>(null);
  
  // WebSocket 连接
  const { isConnected, send, disconnect, path, connect, getWebSocket, cancelDisconnect } = useWebSocket(
    conversationId ? `/ws/chat/${conversationId}/` : null
  );
  
  const {
    getMessages,
    addMessage,
    updateMessages,
    updateSyncTime,
    getPagination,
    updatePagination,
    clearMessages,
    clearSyncTime,
    clearPagination
  } = useMessageStore();

  // 清理会话数据
  const cleanupConversation = useCallback((conversationId: number) => {
    clearMessages(conversationId);
    clearSyncTime(conversationId);
    clearPagination(conversationId);
  }, [clearMessages, clearSyncTime, clearPagination]);

  // 加载历史消息
  const loadHistoryMessages = useCallback(async (page: number = 1) => {
    if (!conversationId) return;
    
    try {
      if (page === 1) {
        setLoading(true);
      }
      setLoadingMore(true);
      const response = await chatService.getHistoryMessages(conversationId, page);
      if (response.status === 404) {
        updateMessages(conversationId, []);
        return;
      }
      
      // 更新分页信息
      updatePagination(conversationId, {
        total: response.total,
        currentPage: response.page,
        hasMore: response.has_more
      });
      
      // 合并消息并去重
      const currentMessages = getMessages(conversationId);
      const messageMap = new Map<number, Message>(currentMessages.map(msg => [msg.id, msg]));
      response.results.forEach((msg: Message) => messageMap.set(msg.id, msg));
      const newMessages = Array.from(messageMap.values())
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      updateMessages(conversationId, newMessages);
      
    } catch (error) {
      console.error('加载历史消息失败:', error);
      antMessage.error('加载消息失败');
    } finally {
      setLoadingMore(false);
      if (page === 1) {
        setLoading(false);
      }
    }
  }, [conversationId, getMessages, updateMessages, updatePagination]);

  // 初始化会话
  const initializeConversation = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      // 先检查是否有缓存
      const cachedMessages = getMessages(conversationId);
      if (cachedMessages.length > 0) {
        setLoading(false);
        return;
      }
      
      // 加载第一页消息
      await loadHistoryMessages(1);
      // 设置初始同步时间
      updateSyncTime(conversationId, new Date().toISOString());
    } catch (error) {
      console.error('初始化会话失败:', error);
      antMessage.error('加载会话失败');
    } finally {
      setLoading(false);
    }
  }, [conversationId, loadHistoryMessages, updateSyncTime, getMessages]);


  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId) return;
    
    try {
      send(JSON.stringify({
        type: 'chat_message',
        message: content
      }), conversationId);
    } catch (wsError) {
      console.error('WebSocket 发送失败，尝试 HTTP:', wsError);
      try {
        // HTTP 发送
        const response = await chatService.sendMessage(conversationId, content);
        addMessage(conversationId, response);
      } catch (httpError) {
        console.error('HTTP 发送失败:', httpError);
        antMessage.error('发送消息失败');
        throw httpError;
      }
    }
  }, [conversationId, send, addMessage]);

  // 处理 WebSocket 消息
  useWebSocketMessage({
    handleChatMessage: useCallback((context: MessageContext) => {
      const { message }: { message: Message } = context;
      if (message.conversation === conversationId) {
        addMessage(conversationId, message);
      }
    }, [conversationId, addMessage])
  });

  // 初始加载和会话切换处理
  useEffect(() => {
    if (prevConversationIdRef.current !== conversationId) {
      // 清理旧会话的状态
      if (prevConversationIdRef.current) {
        cleanupConversation(prevConversationIdRef.current);
      }
      // 初始化新会话
      if (conversationId) {
        initializeConversation();
      }
      // 更新引用
      prevConversationIdRef.current = conversationId;
    }
  }, [conversationId, initializeConversation, cleanupConversation]);

  // 清理工作
  useEffect(() => {
    return () => {
      if (conversationId) {
        cleanupConversation(conversationId);
      }
    };
  }, [conversationId, cleanupConversation]);

  return {
    messages: getMessages(conversationId || 0),
    loading,
    loadingMore,
    sendMessage,
    isConnected,
    disconnect,
    connect,
    send,
    path,
    getWebSocket,
    cancelDisconnect,
    loadMore: () => {
      const pagination = getPagination(conversationId || 0);
      if (pagination?.hasMore) {
        loadHistoryMessages(pagination.currentPage + 1);
      }
    },
    hasMore: getPagination(conversationId || 0)?.hasMore || false,
    refresh: initializeConversation
  };
}; 