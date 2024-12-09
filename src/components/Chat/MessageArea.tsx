import React, { useEffect, useRef, useState } from 'react';
import { Input, Button, Empty } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import MessageList from './MessageList';
import { useMessages } from '../../hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import type { InputRef } from 'antd/lib/input';

interface MessageAreaProps {
  conversationId: number | null;
}

const MessageArea: React.FC<MessageAreaProps> = ({ conversationId }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<InputRef>(null);
  const { messages, loading, sendMessage } = useMessages(conversationId);
  const { conversations, refetch: refetchConversations } = useConversations();

  const currentConversation = conversations.find(c => c.id === conversationId);
  const recipientName = currentConversation?.other_participant?.username;

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (conversationId && inputRef.current?.input) {
      inputRef.current.input.focus();
    }
  }, [conversationId]);

  if (!conversationId) {
    return (
      <div className="h-full flex items-center justify-center">
        <Empty description="选择一个对话开始聊天" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="py-[0.2rem] px-4 border-b border-gray-200 flex-none text-center">
        <h2 className="text-sm">{recipientName || '聊天'}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <MessageList messages={messages} loading={loading} />
      </div>
      <div className="flex-none p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="输入消息..."
            onKeyPress={handleKeyPress}
            autoComplete="off"
            size="large"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            size="large"
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageArea; 