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
      console.log('UserWebSocket: Not connecting - auth status:', { isAuthenticated, userId: user?.uid });
      return;
    }

    const token = getToken();
    if (!token) {
      console.log('UserWebSocket: No token found');
      return;
    }

    // 如果已经有连接，不要创建新的连接
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('UserWebSocket: Connection already exists:', wsRef.current.readyState);
      return;
    }

    try {
      const wsUrl = getWebSocketUrl(`/ws/user/${user.uid}/?token=${token}`);
      console.log('UserWebSocket: Connecting to:', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnected(true);
        reconnectCountRef.current = 0;
        console.log('UserWebSocket: Connected successfully');
      };

      ws.onclose = (event) => {
        setConnected(false);
        console.log('UserWebSocket: Connection closed', {
          wasClean: event.wasClean,
          code: event.code,
          reason: event.reason,
          reconnectAttempts: reconnectCountRef.current
        });

        // 只有在非正常关闭且未达到最大重试次数时才尝试重连
        if (!event.wasClean && isAuthenticated && reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          console.log('UserWebSocket: Scheduling reconnect attempt');
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectCountRef.current += 1;
            console.log('UserWebSocket: Attempting reconnect', reconnectCountRef.current);
            connect();
          }, 3000);
        } else if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.log('UserWebSocket: Max reconnect attempts reached');
          message.error('WebSocket 连接失败，请刷新页面重试');
        }
      };

      ws.onerror = (error) => {
        console.error('UserWebSocket: Error occurred:', error);
      };

      ws.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);
          const isDebug = false; // 设置为 true 开启详细日志

          if (isDebug) {
            console.log('UserWebSocket: Raw message:', rawData);
          }

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

          if (isDebug) {
            console.log('UserWebSocket: Processed message:', {
              type: processedData.type,
              messageId: processedData.type === 'chat_message' ? processedData.message.id : undefined,
              messageContent: processedData.type === 'chat_message' ? processedData.message.content : undefined,
              senderId: processedData.type === 'chat_message' ? processedData.message.sender.uid : undefined,
              conversationId: processedData.type === 'chat_message' ? processedData.message.conversation : undefined,
              source: 'user-websocket'
            });
          }
          
          // 创建一个新的事件，并指定它来自用户级别的 WebSocket
          const customEvent = new CustomEvent('ws-message', { 
            detail: processedData
          });
          
          if (isDebug) {
            console.log('UserWebSocket: Dispatching event to window:', customEvent.detail);
          }
          
          window.dispatchEvent(customEvent);
        } catch (error) {
          console.error('UserWebSocket: Error processing message:', error);
        }
      };

      wsRef.current = ws;

      return () => {
        if (wsRef.current) {
          console.log('UserWebSocket: Cleaning up connection');
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

  // 监控连接状态变化
  useEffect(() => {
    console.log('UserWebSocket: Connection status changed:', connected);
  }, [connected]);

  // 初始化连接
  useEffect(() => {
    console.log('UserWebSocket: Initializing connection');
    const cleanup = connect();
    return () => {
      console.log('UserWebSocket: Cleaning up on unmount');
      if (cleanup) cleanup();
    };
  }, [connect]);

  // 处理认证状态变化
  useEffect(() => {
    console.log('UserWebSocket: Auth state changed:', { isAuthenticated, userId: user?.uid });
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