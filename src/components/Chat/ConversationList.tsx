import React from 'react';
import { List, Avatar, Badge, Skeleton } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Conversation } from '@/types/chat';
import { getMediaUrl } from '@/utils/url';

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
      className="conversation-list h-full overflow-y-auto"
      loading={loading}
      dataSource={conversations}
      locale={{ emptyText: '暂无消息' }}
      renderItem={(conversation) => {
        const lastMessage = conversation.last_message;
        const unreadCount = conversation.unread_count || 0;
        const otherParticipant = conversation.other_participant;
        
        if (!otherParticipant) {
          return null;
        }

        const avatarUrl = otherParticipant.avatar_url || getMediaUrl(otherParticipant.avatar);

        return (
          <List.Item
            className={`group cursor-pointer hover:bg-gray-50 transition-colors duration-200 relative ${
              selectedId === conversation.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => onSelect(conversation.id)}
          >
            <div 
              className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center transform -translate-x-8 group-hover:translate-x-0 transition-transform duration-200"
              onClick={(e) => {
                e.stopPropagation();
                // 删除功能待实现
              }}
            >
              <CloseOutlined className="text-gray-400 text-sm hover:text-gray-600" />
            </div>
            <div className="flex items-start w-full gap-3 pl-8 pr-4 py-3">
              <Badge count={unreadCount} offset={[-5, 5]}>
                <Avatar 
                  src={avatarUrl}
                  size={40}
                  className="flex-shrink-0"
                >
                  {otherParticipant.username[0]}
                </Avatar>
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm truncate">
                    {otherParticipant.username}
                  </span>
                  {lastMessage && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {dayjs(lastMessage.created_at).fromNow()}
                    </span>
                  )}
                </div>
                {loading ? (
                  <Skeleton.Input style={{ width: '100%' }} size="small" />
                ) : (
                  <div className="text-gray-500 text-xs truncate">
                    {lastMessage?.content || '暂无消息'}
                  </div>
                )}
              </div>
            </div>
          </List.Item>
        );
      }}
    />
  );
};

export default ConversationList; 