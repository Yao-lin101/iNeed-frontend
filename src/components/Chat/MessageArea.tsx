import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input, Button, Spin } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import MessageList from './MessageList';
import { useMessages } from '../../hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import { useWebSocketMessage, MessageContext } from '@/hooks/useWebSocketMessage';
import { chatService } from '@/services/chatService';
import type { InputRef } from 'antd/lib/input';
import { useMessageArea } from '@/contexts/MessageAreaContext';

interface MessageAreaProps {
  conversationId: number | null;
  height?: string;
  recipientName?: string;
}

const MessageArea: React.FC<MessageAreaProps> = ({ 
  conversationId,
  height = '100%',
  recipientName
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<InputRef>(null);
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const { 
    messages, 
    loading, 
    loadingMore,
    sendMessage,
    disconnect,
    isConnected,
    connect,
    send,
    cancelDisconnect,
  } = useMessages(conversationId);
  const { refetch: refetchConversations } = useConversations();
  const prevConversationIdRef = useRef<number | null>(null);
  const { setActiveConversation } = useMessageArea();

  // 当会话ID变化时
  useEffect(() => {
    // 当 conversationId 变化时设置 activeConversation
    if (prevConversationIdRef.current !== conversationId) {
      setActiveConversation(conversationId);
      prevConversationIdRef.current = conversationId;
    }
    if (conversationId && isConnected(conversationId)) {
      cancelDisconnect(conversationId);
    }

    // 组件卸载时清除 activeConversation
    return () => {
      const isUnmounting = !messageAreaRef.current;
      // 安排延迟断开 WebSocket
      if (conversationId && isConnected(conversationId)) {
        disconnect(conversationId);
      }
      if (isUnmounting) {
        setActiveConversation(null);
      }
    };
  }, [conversationId, setActiveConversation]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (content && conversationId) {
      try {
        // 准备要发送的消息
        const messageToSend = JSON.stringify({
          type: 'chat_message',
          message: content
        });

        // 检查是否有活跃的连接
        if (!conversationId || !isConnected(conversationId)) {
          connect();
          // 等待连接建立
          await new Promise<void>((resolve) => {
            const checkConnection = () => {
              if (conversationId && isConnected(conversationId)) {
                send(messageToSend, conversationId);
                resolve();
              } else {
                setTimeout(checkConnection, 100);
              }
            };
            checkConnection();
          });
        } else {
          // 已有连接，直接发送
          send(messageToSend, conversationId);
        }
        setInputValue('');
        refetchConversations();
      } catch (error) {
        console.error('Failed to send message:', error);
        // 如果 WebSocket 发送失败，尝试 HTTP
        try {
          await sendMessage(content);
          setInputValue('');
        } catch (httpError) {
          console.error('HTTP 发送也失败:', httpError);
        }
      }
    }
  };

  // 处理消息加载完成后的操作
  useEffect(() => {
    const shouldProcess = !loading && messages.length > 0;

    if (shouldProcess) {
      // 标记已读
      if (conversationId) {
        chatService.markAsRead(conversationId)
          .then(() => {
            refetchConversations();
          })
          .catch(error => {
            console.error('[MessageArea] Mark as read failed:', error);
          });
      }

      // 滚动到底部
      const tasks: Promise<void>[] = [];
      tasks.push(
        new Promise<void>(resolve => {
          const messageList = document.querySelector('.message-list');
          if (messageList && messageList.scrollTop === 0) {
            requestAnimationFrame(() => {
              messageList.scrollTop = messageList.scrollHeight;
              resolve();
            });
          } else {
            resolve();
          }
        })
      );

      Promise.all(tasks).catch(console.error);
    }
  }, [conversationId, messages, loading, refetchConversations]);

  // 处理新消息
  useWebSocketMessage({
    handleChatMessage: useCallback((_context: MessageContext) => {
      if (!conversationId) return;
    }, [conversationId])
  });

  return (
    <div 
      ref={messageAreaRef} 
      className="flex flex-col h-full"
      style={{ height }}
    >
      <div className="flex-none py-2 px-4 border-b text-center">
        <h2 className="text-base font-medium text-gray-700 m-0">
          {recipientName || '聊天'}
        </h2>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* 加载更多提示 */}
        {loadingMore && (
          <div className="flex justify-center items-center py-2">
            <Spin size="small" />
          </div>
        )}
        
        <MessageList
          messages={messages}
          loading={loading}
        />
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onPressEnter={handleSend}
            placeholder="输入消息..."
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageArea; 