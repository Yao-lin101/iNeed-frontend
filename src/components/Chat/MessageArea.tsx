import React, { useEffect, useRef, useState } from 'react';
import { Input, Button, Empty } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import MessageList from './MessageList';
import { useMessages } from '../../hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import { chatService } from '@/services/chatService';
import type { InputRef } from 'antd/lib/input';

interface MessageAreaProps {
  conversationId: number | null;
}

const MessageArea: React.FC<MessageAreaProps> = ({ conversationId }) => {
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

  // 检查并清理历史消息
  const checkAndCleanMessages = async (oldConversationId: number) => {
    console.log('[MessageArea] Checking messages for conversation:', oldConversationId);
    try {
      // 检查对话是否还存在
      const conversation = conversations.find(c => c.id === oldConversationId);
      if (!conversation) {
        console.log('[MessageArea] Conversation no longer exists:', oldConversationId);
        return;
      }

      const hasNew = await chatService.hasNewMessages(oldConversationId);
      console.log('[MessageArea] Has new messages:', hasNew);
      if (hasNew) {
        console.log('[MessageArea] Cleaning messages for conversation:', oldConversationId);
        await chatService.cleanMessages(oldConversationId);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('[MessageArea] Conversation was deleted:', oldConversationId);
        return;
      }
      console.error('Failed to clean messages:', error);
    }
  };

  // 当会话ID变化时
  useEffect(() => {
    console.log('[MessageArea] Conversation changed:', { 
      prev: prevConversationIdRef.current, 
      current: conversationId 
    });
    // 如果之前有选中的会话，检查并清理消息
    if (prevConversationIdRef.current && prevConversationIdRef.current !== conversationId) {
      checkAndCleanMessages(prevConversationIdRef.current);
    }
    // 更新前一个会话ID
    prevConversationIdRef.current = conversationId;

    // 等待消息加载完成后滚动到底部
    if (conversationId && !loading && messages.length > 0) {
      console.log('[MessageArea] Scrolling to bottom, messages:', messages.length);
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

  // 组件卸载时也检查清理
  useEffect(() => {
    return () => {
      if (prevConversationIdRef.current) {
        checkAndCleanMessages(prevConversationIdRef.current);
      }
    };
  }, []);

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
    <div ref={messageAreaRef} className="flex flex-col h-full">
      <div className="py-[0.2rem] px-4 border-b border-gray-200 flex-none">
        <h2 className="text-sm">{recipientName}</h2>
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