import React, { useEffect, useRef, useState } from 'react';
import { Input, Button, Empty } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import MessageList from './MessageList';
import { useMessages } from '../../hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import { useWebSocketMessage } from '@/hooks/useWebSocketMessage';
import { chatService } from '@/services/chatService';
import type { InputRef } from 'antd/lib/input';

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
  const { messages, loading, sendMessage } = useMessages(conversationId);
  const { conversations, refetch: refetchConversations } = useConversations();
  const prevConversationIdRef = useRef<number | null>(null);

  const currentConversation = conversations.find(c => c.id === conversationId);
  const recipientName = currentConversation?.other_participant?.username;

  // 滚动到底部
  const scrollToBottom = () => {
    if (messageAreaRef.current) {
      const messageList = messageAreaRef.current.querySelector('.message-list');
      if (messageList) {
        messageList.scrollTop = messageList.scrollHeight;
      }
    }
  };

  // 当会话ID变化时
  useEffect(() => {
    // 更新前一个会话ID
    prevConversationIdRef.current = conversationId;

    // 等待消息加载完成后滚动到底部
    if (conversationId && !loading && messages.length > 0 && messageAreaRef.current) {
      scrollToBottom();
    }
  }, [conversationId, loading, messages.length]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (content && conversationId) {
      try {
        await sendMessage(content);
        setInputValue('');
        refetchConversations();
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  // 监听会话ID变化
  useEffect(() => {
    if (conversationId) {
      // 加载消息
      refetchConversations();
      // 标记为已读
      chatService.markAsRead(conversationId).catch(error => {
        console.error('标记已读失败:', error);
      });
    }
  }, [conversationId, refetchConversations]);

  // 处理新消息
  useWebSocketMessage({
    handleChatMessage: (context) => {
      if (!conversationId) return;
      
      const { message } = context;
      // 如果是当前会话的新消息，立即标记为已读
      if (message.conversation === conversationId) {
        chatService.markAsRead(conversationId).catch(error => {
          console.error('标记已读失败:', error);
        });
        // 刷新消息列表
        refetchConversations();
      }
    }
  });

  if (!conversationId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Empty
          description={
            <span className="text-gray-400">
              选择一个会话开始聊天
            </span>
          }
        />
      </div>
    );
  }

  return (
    <div ref={messageAreaRef} className="flex flex-col bg-[#f9fafb]" style={{ height }}>
      <div className="py-2 px-4 border-b border-gray-200 flex-none flex items-center justify-center bg-white">
        <h2 className="text-sm font-medium text-gray-700">{recipientName}</h2>
      </div>
      <div className="flex-1 min-h-0">
        <MessageList messages={messages} loading={loading} />
      </div>
      <div className="flex p-4 border-t border-gray-200">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleSend}
          placeholder="输入消息..."
          autoComplete="off"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          className="ml-2"
        >
          发送
        </Button>
      </div>
    </div>
  );
};

export default MessageArea; 