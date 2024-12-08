import React from 'react';
import { List, Avatar, Badge, Skeleton } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Conversation } from '@/types/chat';

// 配置 dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading,
  selectedId,
  onSelect,
}) => {
  return (
    <List
      className="conversation-list"
      loading={loading}
      dataSource={conversations}
      locale={{ emptyText: '暂无消息' }}
      renderItem={(conversation) => {
        const lastMessage = conversation.last_message;
        const unreadCount = conversation.unread_count || 0;

        return (
          <List.Item
            className={`cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
              selectedId === conversation.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => onSelect(conversation.id)}
          >
            <List.Item.Meta
              avatar={
                <Badge count={unreadCount} offset={[-5, 5]}>
                  <Avatar 
                    src={conversation.participants[0].avatar_url}
                    size="large"
                    className="border border-gray-200"
                  >
                    {conversation.participants[0].username[0]}
                  </Avatar>
                </Badge>
              }
              title={
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {conversation.participants[0].username}
                  </span>
                  {lastMessage && (
                    <span className="text-xs text-gray-400">
                      {dayjs(lastMessage.created_at).fromNow()}
                    </span>
                  )}
                </div>
              }
              description={
                loading ? (
                  <Skeleton.Input style={{ width: 200 }} size="small" />
                ) : (
                  <div className="text-gray-500 text-sm truncate">
                    {lastMessage?.content || '暂无消息'}
                  </div>
                )
              }
            />
          </List.Item>
        );
      }}
    />
  );
};

export default ConversationList; 