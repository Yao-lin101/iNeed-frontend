import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input, Button, Spin } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import MessageList from './MessageList';
import { useMessages } from '../../hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import { useWebSocketMessage, MessageContext } from '@/hooks/useWebSocketMessage';
import { chatService } from '@/services/chatService';
import type { InputRef } from 'antd/lib/input';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMessageArea } from '@/contexts/MessageAreaContext';

interface MessageAreaProps {
  conversationId: number | null;
  height?: string;
}

const MessageArea: React.FC<MessageAreaProps> = ({ 
  conversationId,
  height = '100%'
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<InputRef>(null);
  const messageAreaRef = useRef<HTMLDivElement>(null);
  const hasUpdatedRef = useRef(false);
  const { 
    messages, 
    loading, 
    loadingMore,
    sendMessage,
    disconnect,
    isConnected,
    connect,
    send,
    getWebSocket,
    cancelDisconnect,
  } = useMessages(conversationId);
  const { refetch: refetchConversations } = useConversations();
  const prevConversationIdRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveConversation } = useMessageArea();


  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (messageAreaRef.current) {
      const messageList = messageAreaRef.current.querySelector('.message-list');
      if (messageList) {
        messageList.scrollTop = messageList.scrollHeight;
      }
    }
  }, []);

  // 当会话ID变化时
  useEffect(() => {
    // 更新前一个会话ID
    prevConversationIdRef.current = conversationId;

    // 等待消息加载完成动
    if (conversationId && !loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [conversationId, loading, messages.length, scrollToBottom]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (content && conversationId) {
      try {
        console.log('准备发送消息:', content);
        // 准备要发送的消息
        const messageToSend = JSON.stringify({
          type: 'chat_message',
          message: content
        });

        // 检查是否有活跃的连接
        if (!conversationId || !isConnected(conversationId)) {
          console.log('需要建立新连接');
          connect();
          // 等待连接建立
          await new Promise<void>((resolve) => {
            const checkConnection = () => {
              if (conversationId && isConnected(conversationId)) {
                console.log('连接已建立，发送消息');
                send(messageToSend, conversationId);
                resolve();
              } else {
                console.log('等待连接建立, 当前状态:', getWebSocket(conversationId)?.readyState);
                setTimeout(checkConnection, 100);
              }
            };
            checkConnection();
          });
        } else {
          // 已有连接，直接发送
          console.log('使用现有连接发送消息');
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

  // 监听会话ID变化
  useEffect(() => {
    if (conversationId) {
      // 加载消息
      refetchConversations();
    }
  }, [conversationId, refetchConversations]);

  // 单独处理标记已读
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      chatService.markAsRead(conversationId).catch(error => {
        console.error('标记已读失败:', error);
      });
    }
  }, [conversationId, messages.length]);

  // 处理新消息
  useWebSocketMessage({
    handleChatMessage: useCallback((context: MessageContext) => {
      if (!conversationId) return;
      
      const { message } = context;
      if (message.conversation === conversationId && messages.length > 0) {
        console.log('标记已读:', conversationId);
        chatService.markAsRead(conversationId).catch(error => {
          console.error('标记已读失败:', error);
        });
      }
    }, [conversationId, messages])
  });

  // 处理 URL 更新和聊天上下文状态
  useEffect(() => {
    // 只在 conversationId 变化时更新 URL
    if (prevConversationIdRef.current !== conversationId) {
      // 处理 URL 更新
      if (conversationId) {
        // 如果已经有连接，取消延迟断开
        if (isConnected(conversationId)) {
          console.log('打开窗口，取消延迟断开:', conversationId);
          cancelDisconnect(conversationId);
        }

        const searchParams = new URLSearchParams(location.search);
        searchParams.set('conversation', conversationId.toString());
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  
        // 更新聊天上下文状态
        if (!hasUpdatedRef.current) {
          setActiveConversation(conversationId);
          hasUpdatedRef.current = true;
        }
      } else {
        // 移除会话 ID
        const searchParams = new URLSearchParams(location.search);
        searchParams.delete('conversation');
        navigate(`${location.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`, { replace: true });
      }
    }

    // 清理函
    return () => {
      const isUnmounting = !messageAreaRef.current;
      if (isUnmounting) {
        // 安排延迟断开 WebSocket
        if (conversationId && isConnected(conversationId)) {
          disconnect(conversationId);
        }

        // 只有在离开消中心时才清除状态
        if (!location.pathname.startsWith('/mc/')) {
          // 清除 URL 参数
          const searchParams = new URLSearchParams(location.search);
          if (searchParams.has('conversation')) {
            searchParams.delete('conversation');
            navigate(`${location.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`, { replace: true });
          }
          hasUpdatedRef.current = false;
        }
        // 清除活跃会话
        setActiveConversation(null);
      }
    };
  }, [conversationId, navigate, location.pathname, disconnect, isConnected, cancelDisconnect]);


  return (
    <div 
      ref={messageAreaRef} 
      className="flex flex-col h-full"
      style={{ height }}
    >
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