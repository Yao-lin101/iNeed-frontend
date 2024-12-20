import { useCallback, useRef } from 'react';
import { message } from 'antd';
import { getToken } from '../utils/auth';
import { useAuthStore } from '../store/useAuthStore';
import { getWebSocketUrl } from '../utils/url';
import { WebSocketMessageData } from './useWebSocketMessage';

// 全局存储所有 WebSocket 连接
const globalWsMap = new Map<number, WebSocket>();
const globalTimeoutMap = new Map<number, number>();

export function useWebSocket(path: string | null) {
  const { isAuthenticated } = useAuthStore();
  const pendingMessagesRef = useRef<string[]>([]);


  // 延迟断开连接
  const scheduleDisconnect = useCallback((conversationId: number) => {
    const existingTimeout = globalTimeoutMap.get(conversationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    const timeoutId = window.setTimeout(() => {
      // 只关闭连接，不删除它
      const ws = globalWsMap.get(conversationId);
      if (ws) {
        ws.close();
      }
      globalTimeoutMap.delete(conversationId);
    }, 3 * 60 * 1000); // 3分钟
    globalTimeoutMap.set(conversationId, timeoutId);
  }, []);

  // 取消延迟断开
  const cancelDisconnect = useCallback((conversationId: number) => {
    const timeoutId = globalTimeoutMap.get(conversationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      globalTimeoutMap.delete(conversationId);
    }
  }, []);

  // 获取连接
  const getConnection = useCallback((conversationId: number) => {
    const ws = globalWsMap.get(conversationId);
    // 如果连接已关闭或正在关闭，删除它
    if (ws && (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING)) {
      globalWsMap.delete(conversationId);
      return null;
    }
    return ws;
  }, []);

  // 建立连接
  const connect = useCallback(() => {
    // 从 path 中提取 conversationId
    const match = path?.match(/\/chat\/(\d+)\//);
    const newConversationId = match ? parseInt(match[1]) : null;
    
    if (!newConversationId) return;

    // 检查是否已经有该会话的连接
    const existingWs = getConnection(newConversationId);
    if (existingWs?.readyState === WebSocket.OPEN || 
        existingWs?.readyState === WebSocket.CONNECTING) {
      return;
    }

    if (!path || !isAuthenticated) {
      return;
    }

    const token = getToken();
    if (!token) return;

    try {
      const ws = new WebSocket(getWebSocketUrl(`${path}?token=${token}`));
      globalWsMap.set(newConversationId, ws);

      ws.onopen = () => {
        while (pendingMessagesRef.current.length > 0) {
          const message = pendingMessagesRef.current.shift();
          if (message) getConnection(newConversationId)?.send(message);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessageData;
          // 验证消息是否属于当前会话
          if (data.message?.conversation !== newConversationId) {
            return;
          }
          const customEvent = new CustomEvent('ws-message', { 
            detail: {
              ...data,
              source: 'chat-websocket'
            }
          });
          window.dispatchEvent(customEvent);
        } catch (error) {
          message.error('消息解析失败');
        }
      };
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error);
      message.error('创建 WebSocket 连接失败');
    }
  }, [path, isAuthenticated, cancelDisconnect]);

  return {
    isConnected: useCallback((conversationId: number) => {
      const ws = getConnection(conversationId);
      return ws?.readyState === WebSocket.OPEN;
    }, [getConnection]),
    connect,
    disconnect: (conversationId: number) => scheduleDisconnect(conversationId),
    cancelDisconnect: (conversationId: number) => cancelDisconnect(conversationId),
    path,
    getWebSocket: getConnection,
    send: async (data: string, conversationId: number) => {
      const ws = getConnection(conversationId);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(data);
      } else {
        pendingMessagesRef.current.push(data);
        // 等待连接建立
        await new Promise<void>((resolve, reject) => {
          const maxAttempts = 10;
          let attempts = 0;
          
          const checkConnection = () => {
            const currentWs = getConnection(conversationId);
            if (currentWs?.readyState === WebSocket.OPEN) {
              resolve();
            } else if (attempts >= maxAttempts) {
              console.error('连接超时');
              reject(new Error('连接超时'));
            } else {
              attempts++;
              setTimeout(checkConnection, 100);
            }
          };
          
          checkConnection();
        });
      }
    }
  };
} 