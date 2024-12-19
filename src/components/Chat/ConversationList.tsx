import React, { useRef, useEffect } from 'react';
import { List, Avatar, Badge, Modal, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Conversation } from '@/types/chat';
import { getMediaUrl } from '@/utils/url';
import { chatService } from '@/services/chatService';
import '@/styles/components/chat/conversation-list.css';

// 配置 dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number | null) => void | Promise<void>;
  onDelete?: (id: number) => void;
  updateUnreadCount?: (conversationId: number, count: number) => void;
  updateLocalUnreadCount?: (conversationId: number, count: number) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading,
  selectedId,
  onSelect,
  onDelete,
  updateLocalUnreadCount,
}) => {
  const listItemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const animationTimeoutsRef = useRef<{ [key: number]: number }>({});

  // 处理会话选择
  const handleSelect = (conversationId: number) => {
    // 只更新本地未读状态
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation?.unread_count) {
      updateLocalUnreadCount?.(conversationId, 0);
    }
    onSelect(conversationId);
  };

  // 处理删除会话
  const handleDelete = async (conversationId: number) => {
    Modal.confirm({
      title: '删除会话',
      content: '确定要删除这个会话吗？删除后将只能看到新消息。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await chatService.deleteConversation(conversationId);
          message.success('会话已删除');
          if (selectedId === conversationId) {
            onSelect(null);
          }
          onDelete?.(conversationId);
        } catch (error) {
          message.error('删除会话失败');
        }
      },
    });
  };

  // 清理动画超时
  useEffect(() => {
    return () => {
      Object.values(animationTimeoutsRef.current).forEach(timeoutId => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

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
            onClick={() => handleSelect(conversation.id)}
          >
            <div 
              className="delete-button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(conversation.id);
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
                <span className={`font-medium text-sm truncate max-w-[70%] ${unreadCount > 0 ? 'text-blue-600' : ''}`}>
                  {otherParticipant.username}
                </span>
                <div className={`text-xs truncate ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                  {lastMessage?.content || '暂无消息'}
                </div>
              </div>
            </div>
          </List.Item>
        );
      }}
    />
  );
};

export default ConversationList; 