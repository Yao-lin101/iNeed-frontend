import React, { useRef, useEffect } from 'react';
import { List, Avatar, Badge, Skeleton } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Conversation } from '@/types/chat';
import { getMediaUrl } from '@/utils/url';
import { useAuthStore } from '@/store/useAuthStore';
import '@/styles/components/chat/conversation-list.css';

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
  const { user } = useAuthStore();
  const prevConversationsRef = useRef<Conversation[]>([]);
  const listItemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // 检查会话是否有新消息
  const hasNewMessage = (conversation: Conversation, prevConversations: Conversation[]) => {
    const prevConversation = prevConversations.find(c => c.id === conversation.id);
    if (!prevConversation) return false;
    
    const currentLastMessage = conversation.last_message;
    const prevLastMessage = prevConversation.last_message;
    
    return currentLastMessage && prevLastMessage && 
           currentLastMessage.id !== prevLastMessage.id;
  };

  // 监听会话列表变化
  useEffect(() => {
    conversations.forEach(conversation => {
      if (hasNewMessage(conversation, prevConversationsRef.current)) {
        // 如果不是当前选中的会话，且发送者不是当前用户，添加高亮动画
        const isSelected = conversation.id === selectedId;
        const lastMessage = conversation.last_message;
        const isSelfMessage = lastMessage?.sender.uid === user?.uid;
        
        if (!isSelected && !isSelfMessage && listItemRefs.current[conversation.id]) {
          const element = listItemRefs.current[conversation.id];
          element?.classList.add('new-message-highlight');
          setTimeout(() => {
            element?.classList.remove('new-message-highlight');
          }, 2000);
        }
      }
    });
    
    prevConversationsRef.current = conversations;
  }, [conversations, selectedId, user?.uid]);

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
        const isSelected = selectedId === conversation.id;

        return (
          <List.Item
            ref={el => listItemRefs.current[conversation.id] = el}
            className={`conversation-item ${isSelected ? 'selected' : ''} ${unreadCount > 0 ? 'unread' : ''}`}
            onClick={() => onSelect(conversation.id)}
          >
            <div 
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                // 删除功能待实现
              }}
            >
              <CloseOutlined className="text-gray-400 text-sm hover:text-gray-600" />
            </div>
            <div className="flex items-start w-full py-3 px-8">
              <Badge 
                count={unreadCount} 
                offset={[-5, 5]}
                className={unreadCount > 0 ? 'badge-bounce' : ''}
              >
                <Avatar 
                  src={avatarUrl}
                  size={40}
                  className="flex-shrink-0"
                >
                  {otherParticipant.username[0]}
                </Avatar>
              </Badge>
              <div className="flex-1 min-w-0 ml-4">
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-medium text-sm truncate max-w-[70%] ${unreadCount > 0 ? 'text-blue-600' : ''}`}>
                    {otherParticipant.username}
                  </span>
                  {lastMessage && (
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {dayjs(lastMessage.created_at).fromNow()}
                    </span>
                  )}
                </div>
                {loading ? (
                  <Skeleton.Input style={{ width: '100%' }} size="small" />
                ) : (
                  <div className={`text-xs truncate ${
                    unreadCount > 0 ? 'text-gray-900' : 'text-gray-500'
                  }`}>
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