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
    console.log('安排延迟断开, conversationId:', conversationId);
    const existingTimeout = globalTimeoutMap.get(conversationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    const timeoutId = window.setTimeout(() => {
      console.log('延迟时间到，执行断开, conversationId:', conversationId);
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
    console.log('取消延迟断开, conversationId:', conversationId);
    const timeoutId = globalTimeoutMap.get(conversationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      globalTimeoutMap.delete(conversationId);
    }
  }, []);

  // 获取连接
  const getConnection = useCallback((conversationId: number) => {
    const ws = globalWsMap.get(conversationId);
    console.log('获取连接:', {
      conversationId,
      readyState: ws?.readyState,
      allConnections: Array.from(globalWsMap.keys()),
      allTimeouts: Array.from(globalTimeoutMap.keys())
    });
    // 如果连接已关闭或正在关闭，删除它
    if (ws && (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING)) {
      console.log('清理已关闭的连接:', conversationId);
      globalWsMap.delete(conversationId);
      return null;
    }
    return ws;
  }, []);

  // 建立连接
  const connect = useCallback(() => {
    console.log('尝试建立连接:', path);
    // 从 path 中提取 conversationId
    const match = path?.match(/\/chat\/(\d+)\//);
    const newConversationId = match ? parseInt(match[1]) : null;
    
    if (!newConversationId) return;
    
    console.log('当前所有连接:', {
      connections: Array.from(globalWsMap.entries()).map(([id, ws]) => ({
        id,
        readyState: ws.readyState
      }))
    });

    // 检查是否已经有该会话的连接
    const existingWs = getConnection(newConversationId);
    if (existingWs?.readyState === WebSocket.OPEN || 
        existingWs?.readyState === WebSocket.CONNECTING) {
      console.log('已有可用连接:', { 
        readyState: existingWs.readyState,
        conversationId: newConversationId
      });
      return;
    }

    if (!path || !isAuthenticated) {
      console.log('连接条件不满足:', { 
        path, 
        isAuthenticated
      });
      return;
    }

    const token = getToken();
    if (!token) return;

    console.log('开始建立连接, conversationId:', newConversationId);

    try {
      const ws = new WebSocket(getWebSocketUrl(`${path}?token=${token}`));
      globalWsMap.set(newConversationId, ws);

      ws.onopen = () => {
        console.log('WebSocket 连接已建立, conversationId:', newConversationId);
        while (pendingMessagesRef.current.length > 0) {
          const message = pendingMessagesRef.current.shift();
          if (message) getConnection(newConversationId)?.send(message);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket 连接已关闭, conversationId:', newConversationId);
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
      console.log('检查连接状态:', {
        conversationId,
        readyState: ws?.readyState,
        hasConnection: !!ws
      });
      return ws?.readyState === WebSocket.OPEN;
    }, [getConnection]),
    connect,
    disconnect: (conversationId: number) => scheduleDisconnect(conversationId),
    cancelDisconnect: (conversationId: number) => cancelDisconnect(conversationId),
    path,
    getWebSocket: getConnection,
    send: async (data: string, conversationId: number) => {
      console.log('尝试发送消息, readyState:', getConnection(conversationId)?.readyState);
      const ws = getConnection(conversationId);
      if (ws?.readyState === WebSocket.OPEN) {
        console.log('直接发送消息');
        ws.send(data);
      } else {
        console.log('等待连接建立后发送');
        pendingMessagesRef.current.push(data);
        // 等待连接建立
        await new Promise<void>((resolve, reject) => {
          const maxAttempts = 10;
          let attempts = 0;
          
          const checkConnection = () => {
            const currentWs = getConnection(conversationId);
            console.log('检查连接状态, attempts:', attempts, 'readyState:', currentWs?.readyState);
            if (currentWs?.readyState === WebSocket.OPEN) {
              console.log('连接已建立，发送消息');
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