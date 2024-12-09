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
    if (!isAuthenticated || !user?.uid) return;

    const token = getToken();
    if (!token) return;

    // 如果已经有连接，不要创建新的连接
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const ws = new WebSocket(getWebSocketUrl(`/ws/user/${user.uid}/?token=${token}`));

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

      ws.onerror = () => {
        // 错误处理由 onclose 处理
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          window.dispatchEvent(
            new CustomEvent('ws-message', { detail: data })
          );
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
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
      console.error('Failed to create WebSocket connection:', error);
      message.error('创建 WebSocket 连接失败');
      return undefined;
    }
  }, [isAuthenticated, user?.uid]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
    };
  }, [connect]);

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