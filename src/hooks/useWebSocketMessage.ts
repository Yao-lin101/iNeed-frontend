import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Message, Conversation } from '@/types/chat';

// 消息类型定义
export type MessageType = 'chat_message' | 'messages_read' | 'conversation_updated' | 'system_message' | 'notification';

// 消息处理的上下文接口
export interface MessageContext {
  message: Message;
  isInMessageCenter: boolean;
  activeConversationId: number | null;
}

// 消息已读事件数据
export interface MessagesReadData {
  conversation_id: number;
  reader: string;
  unread_count: number;
}

// 会话更新事件数据
export interface ConversationUpdatedData {
  conversation: Conversation;
}

// 新消息事件数据
export interface NewMessageData {
  type: 'new_message';
  message: Message;
  conversation: {
    id: number;
    unread_count: number;
    last_message: Message;
  };
}

// 消息已读事件数据
export interface MessagesReadEventData {
  type: 'messages_read';
  reader: string;
  conversation_id: number;
  unread_count: number;
}

// 消息处理器接口
export interface MessageHandler {
  handleChatMessage?: (context: MessageContext) => void;
  handleMessagesRead?: (data: MessagesReadData) => void;
  handleConversationUpdated?: (data: ConversationUpdatedData) => void;
  handleSystemMessage?: (message: any) => void;
  handleNotification?: (message: any) => void;
}

// WebSocket 消息数据接口
export type WebSocketMessageData = {
  type: 'chat_message';
  message: Message | MessagesReadEventData | NewMessageData;
  source?: 'user-websocket' | 'chat-websocket';
} | {
  type: 'conversation_updated';
  message: ConversationUpdatedData;
  source?: 'user-websocket' | 'chat-websocket';
} | {
  type: 'system_message';
  message: any;
  source?: 'user-websocket' | 'chat-websocket';
} | {
  type: 'notification';
  message: any;
  source?: 'user-websocket' | 'chat-websocket';
};

export function useWebSocketMessage(handler: MessageHandler) {
  const location = useLocation();
  const processedMessages = useRef(new Set<string>());

  // 判断当前页面状态
  const isInMessageCenter = useCallback(() => {
    const result = location.pathname.startsWith('/mc/chat');
    return result;
  }, [location.pathname]);

  // 获取当前活跃的聊天窗口ID
  const getActiveConversationId = useCallback(() => {
    // 从 URL 参数中获取会话 ID
    const searchParams = new URLSearchParams(location.search);
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      return parseInt(conversationId, 10);
    }
    
    // 从pathname中获取会话ID
    const matches = location.pathname.match(/conversation[=/](\d+)/);
    if (matches) {
      return parseInt(matches[1], 10);
    }
    
    return null;
  }, [location.pathname, location.search]);

  // 检查会话是否处于活跃状态
  const isConversationActive = useCallback((conversationId: number) => {
    // 检查URL参数
    const searchParams = new URLSearchParams(location.search);
    const urlConversationId = searchParams.get('conversation');
    if (urlConversationId === conversationId.toString()) {
      return true;
    }
    
    // 检查URL路径中是否包含会话ID
    return location.pathname.includes(`conversation/${conversationId}`) || 
           location.pathname.includes(`conversation=${conversationId}`);
  }, [location.pathname, location.search]);

  // 检查消息是否已处理
  const isMessageProcessed = useCallback((messageKey: string | number) => {
    const key = messageKey.toString();
    if (processedMessages.current.has(key)) {
      return true;
    }
    processedMessages.current.add(key);
    
    // 如果处理的消息太多，清理旧的
    if (processedMessages.current.size > 1000) {
      const oldestMessages = Array.from(processedMessages.current).slice(0, 500);
      processedMessages.current = new Set(oldestMessages);
    }
    
    return false;
  }, []);

  // 处理聊天消息
  const handleChatMessage = useCallback((data: WebSocketMessageData) => {
    if (data.type !== 'chat_message' || !handler.handleChatMessage) return;
    
    // 处理普通聊天消息
    if ('id' in data.message) {
      const message = data.message;
      const messageKey = `${message.id}-${data.source}`;
      if (isMessageProcessed(messageKey)) {
        return;
      }

      // 检查消息来源，避免重复处理
      if (data.source === 'chat-websocket' && message.conversation) {
        if (isConversationActive(message.conversation)) {
          return; // 已经由聊天WebSocket处理了
        }
      }

      handler.handleChatMessage({
        message,
        isInMessageCenter: isInMessageCenter(),
        activeConversationId: getActiveConversationId()
      });
    }
    // 处理消息已读事件
    else if ('type' in data.message && data.message.type === 'messages_read' && handler.handleMessagesRead) {
      handler.handleMessagesRead({
        conversation_id: data.message.conversation_id,
        reader: data.message.reader,
        unread_count: data.message.unread_count
      });
    }
    // 处理新消息事件
    else if ('type' in data.message && data.message.type === 'new_message' && handler.handleChatMessage) {
      const { message } = data.message;
      if (!isMessageProcessed(message.id)) {
        handler.handleChatMessage({
          message,
          isInMessageCenter: isInMessageCenter(),
          activeConversationId: getActiveConversationId()
        });
      }
    }
  }, [handler.handleChatMessage, handler.handleMessagesRead, isInMessageCenter, getActiveConversationId, isMessageProcessed, isConversationActive]);

  // 处理会话更新
  const handleConversationUpdated = useCallback((data: WebSocketMessageData) => {
    if (data.type !== 'conversation_updated' || !handler.handleConversationUpdated) return;
    handler.handleConversationUpdated(data.message as ConversationUpdatedData);
  }, [handler.handleConversationUpdated]);

  // 处理系统消息
  const handleSystemMessage = useCallback((data: WebSocketMessageData) => {
    if (data.type !== 'system_message' || !handler.handleSystemMessage) return;
    handler.handleSystemMessage(data.message);
  }, [handler.handleSystemMessage]);

  // 处理通知消息
  const handleNotification = useCallback((data: WebSocketMessageData) => {
    if (data.type !== 'notification' || !handler.handleNotification) return;
    handler.handleNotification(data.message);
  }, [handler.handleNotification]);

  // 监听 WebSocket 消息
  useEffect(() => {
    const handleWebSocketMessage = (event: CustomEvent) => {
      const data = event.detail as WebSocketMessageData;
      
      switch (data.type) {
        case 'chat_message':
          handleChatMessage(data);
          break;
        case 'conversation_updated':
          handleConversationUpdated(data);
          break;
        case 'system_message':
          handleSystemMessage(data);
          break;
        case 'notification':
          handleNotification(data);
          break;
      }
    };

    window.addEventListener('ws-message', handleWebSocketMessage as EventListener);

    return () => {
      window.removeEventListener('ws-message', handleWebSocketMessage as EventListener);
    };
  }, [handleChatMessage, handleConversationUpdated, handleSystemMessage, handleNotification]);

  // 返回一些有用的工具函数
  return {
    isInMessageCenter,
    getActiveConversationId,
    isMessageProcessed,
  };
} 