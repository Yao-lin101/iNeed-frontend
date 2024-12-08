import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { getToken } from '../utils/auth';
import { useAuthStore } from '../store/useAuthStore';

export function useWebSocket(path: string | null) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const { isAuthenticated } = useAuthStore();

  const connect = useCallback(() => {
    if (!path || !isAuthenticated) return;

    const token = getToken();
    if (!token) {
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${wsProtocol}//${host}${path}?token=${token}`;
    
    console.log('Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      console.log('WebSocket 连接成功');
    };

    ws.onclose = () => {
      setConnected(false);
      // 只有在用户已登录时才尝试重连
      if (isAuthenticated) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      setConnected(false);
      console.error('WebSocket 连接错误:', error);
    };

    ws.onmessage = (event) => {
      try {
        console.log('Raw WebSocket message:', event.data);
        const data = JSON.parse(event.data);
        console.log('Parsed WebSocket message:', data);
        
        // 直接分发消息对象
        window.dispatchEvent(
          new CustomEvent('ws-message', { detail: data })
        );
      } catch (error) {
        console.error('解析 WebSocket 消息失败:', error);
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [path, isAuthenticated]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
    };
  }, [connect]);

  // 监听认证状态变化
  useEffect(() => {
    if (!isAuthenticated && wsRef.current) {
      wsRef.current.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setConnected(false);
    }
  }, [isAuthenticated]);

  const send = useCallback((data: string) => {
    if (wsRef.current && connected) {
      wsRef.current.send(data);
    } else {
      message.error('未连接到服务器');
    }
  }, [connected]);

  return {
    connected,
    send,
  };
} 