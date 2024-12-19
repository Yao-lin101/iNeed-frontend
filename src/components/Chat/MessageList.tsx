import React, { useEffect, useRef } from 'react';
import { Avatar, Skeleton } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Message } from '@/types/chat';
import { useAuthStore } from '@/store/useAuthStore';
import { getMediaUrl } from '@/utils/url';
import '@/styles/components/chat/message-list.css';

// 配置 dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface MessageListProps {
  messages: Message[];
  loading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, loading }) => {
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoadRef = useRef(true);
  const prevMessagesLengthRef = useRef(messages.length);
  const messageListRef = useRef<HTMLDivElement>(null);
  const prevScrollPositionRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
    clientHeight: number;
  } | null>(null);

  // 检查是否接近底部（使用之前保存的滚动位置）
  const isNearBottom = () => {
    const prevPosition = prevScrollPositionRef.current;
    if (!prevPosition) return false;
    
    const threshold = 100;
    const distanceToBottom = prevPosition.scrollHeight - 
      (prevPosition.scrollTop + prevPosition.clientHeight);

    return distanceToBottom <= threshold;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: isFirstLoadRef.current ? 'auto' : 'smooth' });
  };

  // 实时更新滚动位置
  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;

    const updateScrollPosition = () => {
      prevScrollPositionRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
        clientHeight: container.clientHeight
      };
    };

    // 监听滚动结束事件
    container.addEventListener('scrollend', updateScrollPosition);
    // 初始化滚动位置
    updateScrollPosition();

    return () => {
      container.removeEventListener('scrollend', updateScrollPosition);
    };
  }, []);

  // 消息更新时的处理
  useEffect(() => {
    // 检查是否是初次加载或者是发送消息
    const isNewMessageFromSelf = messages.length > prevMessagesLengthRef.current && 
      messages[messages.length - 1]?.sender.uid === user?.uid;

    // 在以下情况滚动到底部：
    // 1. 初次加载
    // 2. 发送自己的消息
    // 3. 接收新消息且当前视图接近底部
    if ((!loading && messages.length > 0 && isFirstLoadRef.current) || 
        isNewMessageFromSelf || 
        (messages.length > prevMessagesLengthRef.current && isNearBottom())) {
      scrollToBottom();
      isFirstLoadRef.current = false;
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, loading, user?.uid]);

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
    <div 
      ref={messageListRef}
      className="h-full overflow-y-auto p-4 message-list"
    >
      <div className="space-y-4">
        {messages.map((message, index) => {
          const currentUserUid = user?.uid || '';
          const senderUid = message.sender.uid || '';
          const isSelf = currentUserUid === senderUid;
          const avatarUrl = message.sender.avatar_url || getMediaUrl(message.sender.avatar);

          return (
            <div
              key={`${message.id}-${message.created_at}-${index}`}
              className={`flex items-start gap-3 ${
                isSelf ? 'flex-row-reverse' : ''
              }`}
            >
              <Avatar src={avatarUrl} size="large">
                {message.sender.username[0]}
              </Avatar>
              <div className={`flex flex-col max-w-[70%] ${
                isSelf ? 'items-end' : 'items-start'
              }`}>
                <div className="text-xs text-gray-500 mb-1">
                  {message.sender.username}
                </div>
                <div className={`group flex items-center gap-2 ${isSelf ? 'flex-row-reverse' : ''}`}>
                  <div className={`message-bubble ${
                    isSelf ? 'message-bubble-self' : 'message-bubble-other'
                  }`}>
                    {message.content}
                  </div>
                  <div className="message-time opacity-0 group-hover:opacity-100">
                    {dayjs(message.created_at).fromNow()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList; 