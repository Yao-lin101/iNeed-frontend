import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { getToken } from '../utils/auth';
import { useAuthStore } from '../store/useAuthStore';
import { getWebSocketUrl } from '../utils/url';

export function useUserWebSocket() {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const reconnectCountRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 3;
  const { isAuthenticated, user } = useAuthStore();

  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.uid) {
      return;
    }

    const token = getToken();
    if (!token) {
      return;
    }

    // 如果已经有连接，不要创建新的连接
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const wsUrl = getWebSocketUrl(`/ws/user/${user.uid}/?token=${token}`);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnected(true);
        reconnectCountRef.current = 0;
      };

      ws.onclose = (event) => {
        setConnected(false);

        // 只有在非正常关闭且未达到最大重试次数时才尝试重连
        if (!event.wasClean && isAuthenticated && reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectCountRef.current += 1;
            connect();
          }, 3000);
        } else if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
          message.error('WebSocket 连接失败，请刷新页面重试');
        }
      };

      ws.onerror = (error) => {
        console.error('UserWebSocket: Error occurred:', error);
      };

      ws.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);

          // 处理消息格式
          let processedData;
          if (rawData.type === 'chat_message' && rawData.message.type === 'new_message') {
            processedData = {
              type: 'chat_message',
              message: rawData.message.message,
              conversation: rawData.message.conversation,
              source: 'user-websocket'
            };
          } else {
            processedData = {
              ...rawData,
              source: 'user-websocket'
            };
          }
          
          // 创建一个新的事件，并指定它来自用户级别的 WebSocket
          const customEvent = new CustomEvent('ws-message', { 
            detail: processedData
          });
          
          window.dispatchEvent(customEvent);
        } catch (error) {
          console.error('UserWebSocket: Error processing message:', error);
        }
      };

      wsRef.current = ws;

      return () => {
        if (wsRef.current) {
          wsRef.current.close(1000, 'Component unmounting');
          wsRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = undefined;
        }
        setConnected(false);
      };
    } catch (error) {
      console.error('UserWebSocket: Failed to create connection:', error);
      message.error('创建 WebSocket 连接失败');
      return undefined;
    }
  }, [isAuthenticated, user?.uid]);

  // 初始化连接
  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
    };
  }, [connect]);

  // 处理认证状态变化
  useEffect(() => {
    if (!isAuthenticated) {
      if (wsRef.current) {
        wsRef.current.close(1000, 'User logged out');
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      setConnected(false);
      reconnectCountRef.current = 0;
    }
  }, [isAuthenticated]);

  return {
    connected,
  };
} 