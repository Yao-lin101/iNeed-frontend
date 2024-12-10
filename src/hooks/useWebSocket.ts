import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { getToken } from '../utils/auth';
import { useAuthStore } from '../store/useAuthStore';
import { getWebSocketUrl } from '../utils/url';
import { WebSocketMessageData } from './useWebSocketMessage';

export function useWebSocket(path: string | null) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const reconnectCountRef = useRef(0);
  const cleanupRef = useRef(false);
  const MAX_RECONNECT_ATTEMPTS = 3;
  const { isAuthenticated } = useAuthStore();

  const cleanup = useCallback(() => {
    cleanupRef.current = true;
    if (wsRef.current) {
      wsRef.current.onclose = null; // 防止触发重连
      wsRef.current.close(1000, 'Cleanup');
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    setConnected(false);
    reconnectCountRef.current = 0;
  }, []);

  const connect = useCallback(() => {
    if (!path || !isAuthenticated || cleanupRef.current) return;

    const token = getToken();
    if (!token) return;

    // 如果已经有连接，不要创建新的连接
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const ws = new WebSocket(getWebSocketUrl(`${path}?token=${token}`));

      ws.onopen = () => {
        if (cleanupRef.current) {
          ws.close();
          return;
        }
        setConnected(true);
        reconnectCountRef.current = 0;
      };

      ws.onclose = (event) => {
        if (cleanupRef.current) return;
        
        setConnected(false);

        // 只有在非正常关闭且未达到最大重试次数时才尝试重连
        if (!event.wasClean && isAuthenticated && reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (!cleanupRef.current) {
              reconnectCountRef.current += 1;
              connect();
            }
          }, 3000);
        } else if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
          message.error('WebSocket 连接失败，请刷新页面重试');
        }
      };

      ws.onmessage = (event) => {
        if (cleanupRef.current) return;
        try {
          const data = JSON.parse(event.data) as WebSocketMessageData;
          
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

      wsRef.current = ws;
    } catch (error) {
      if (!cleanupRef.current) {
        message.error('创建 WebSocket 连接失败');
      }
    }
  }, [path, isAuthenticated]);

  useEffect(() => {
    cleanupRef.current = false;
    connect();

    return () => {
      cleanup();
    };
  }, [connect, cleanup]);

  useEffect(() => {
    if (!isAuthenticated) {
      cleanup();
    }
  }, [isAuthenticated, cleanup]);

  const send = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    } else {
      message.error('未连接到服务器');
    }
  }, []);

  return {
    connected,
    send,
  };
} 