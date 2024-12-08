import React, { useEffect, useRef } from 'react';
import { Avatar, Skeleton } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Message } from '@/types/chat';
import { useAuth } from '@/hooks/useAuth';

// 配置 dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface MessageListProps {
  messages: Message[];
  loading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, loading }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton.Avatar active />
            <div className="flex-1">
              <Skeleton active paragraph={{ rows: 1 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isSelf = message.sender.id === user?.id;

        return (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              isSelf ? 'flex-row-reverse' : ''
            }`}
          >
            <Avatar src={message.sender.avatar_url}>
              {message.sender.username[0]}
            </Avatar>
            <div
              className={`max-w-[70%] ${
                isSelf ? 'items-end' : 'items-start'
              }`}
            >
              <div className="text-xs text-gray-500 mb-1">
                {dayjs(message.created_at).fromNow()}
              </div>
              <div
                className={`rounded-lg p-3 ${
                  isSelf
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList; 