import React, { useEffect, useRef } from 'react';
import { Input, Button, Empty } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import MessageList from './MessageList';
import { useMessages } from '../../hooks/useMessages';
import type { InputRef } from 'antd/lib/input';

interface MessageAreaProps {
  conversationId: number | null;
}

const MessageArea: React.FC<MessageAreaProps> = ({ conversationId }) => {
  const inputRef = useRef<InputRef>(null);
  const { messages, loading, sendMessage } = useMessages(conversationId);

  const handleSend = () => {
    const content = inputRef.current?.input?.value;
    if (content && conversationId) {
      sendMessage(content);
      if (inputRef.current?.input) {
        inputRef.current.input.value = '';
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
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <MessageList messages={messages} loading={loading} />
      </div>
      <div className="flex-none p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
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