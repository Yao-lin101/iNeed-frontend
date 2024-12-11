import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import {
  MessageOutlined,
  NotificationOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import ConversationList from './ConversationList';
import MessageArea from './MessageArea';
import { useConversations } from '@/hooks/useConversations';
import { Empty } from 'antd';
import { chatService } from '@/services/chatService';
import { useNavigate } from 'react-router-dom';

interface ChatContainerProps {
  initialConversationId?: number;
  initialTab?: 'myMessages' | 'system';
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  initialConversationId,
  initialTab = 'myMessages'
}) => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(initialConversationId || null);
  const [currentTab, setCurrentTab] = useState(initialTab);
  const { conversations, loading, refetch: refetchConversations, updateUnreadCount } = useConversations();
  const navigate = useNavigate();

  // 监听初始标签页
  useEffect(() => {
    setCurrentTab(initialTab);
    // 根据初始标签页设置URL
    if (initialTab === 'system') {
      navigate('/mc/sm', { replace: true });
    } else {
      navigate('/mc/chat', { replace: true });
    }
  }, [initialTab, navigate]);

  // 监听初始会话ID
  useEffect(() => {
    if (initialConversationId) {
      setSelectedConversation(initialConversationId);
      // 如果有初始会话ID，确保在消息标签页
      setCurrentTab('myMessages');
      navigate(`/mc/chat?conversation=${initialConversationId}`, { replace: true });
    }
  }, [initialConversationId, navigate]);

  // 处理标签页切换
  const handleTabChange = (key: 'myMessages' | 'system') => {
    setCurrentTab(key);
    if (key === 'system') {
      // 切换到系统通知时，清除选中的会话并导航到系统消息页面
      setSelectedConversation(null);
      navigate('/mc/sm', { replace: true });
    } else {
      // 切换到我的消息时，导航到消息中心
      navigate('/mc/chat', { replace: true });
    }
  };

  // 处理会话选择
  const handleConversationSelect = async (conversationId: number | null) => {
    if (conversationId === null) {
      setSelectedConversation(null);
      navigate('/mc/chat', { replace: true });
      return;
    }
    
    // 找到选中的会话
    const selectedConv = conversations.find(conv => conv.id === conversationId);
    if (!selectedConv) return;

    // 更新URL
    navigate(`/mc/chat?conversation=${conversationId}`, { replace: true });

    // 获取当前未读计数
    const currentUnreadCount = selectedConv.unread_count || 0;
    
    // 更新选中状态
    setSelectedConversation(conversationId);
    
    // 如果有未读消息，先更新未读计数
    if (currentUnreadCount > 0) {
      // 立即更新本地未读计数
      updateUnreadCount(conversationId, 0);
      
      // 调用API标记为已读
      try {
        const response = await chatService.markAsRead(conversationId);

        // 发送WebSocket消息通知其他客户端
        window.dispatchEvent(new CustomEvent('ws-message', {
          detail: {
            type: 'chat_message',
            message: {
              type: 'messages_read',
              conversation_id: conversationId,
              unread_count: currentUnreadCount,
              reader: response.reader
            }
          }
        }));
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
        // 如果API调用失败，恢复未读计数
        updateUnreadCount(conversationId, currentUnreadCount);
      }
    }
  };

  const handleDelete = async () => {
    await refetchConversations();
  };

  const menuItems = [
    {
      key: 'myMessages',
      icon: <MessageOutlined />,
      label: '我的消息',
    },
    {
      key: 'system',
      icon: <NotificationOutlined />,
      label: '系统通知',
    },
  ];

  return (
    <div className="flex h-full">
      <div className="w-[180px] bg-white">
        <div className="py-[0.2rem] px-4 border-b border-gray-200">
          <h2 className="text-sm">消息中心</h2>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentTab]}
          items={menuItems}
          onClick={({ key }) => handleTabChange(key as 'myMessages' | 'system')}
          className="border-0"
        />
      </div>
      <div className="w-2 bg-gray-100" />
      <div className="flex flex-1 flex-col bg-white">
        <div className="h-2 bg-gray-100" />
        <div className="py-[0.2rem] px-4 border-b border-gray-200 flex-none">
          <h2 className="text-sm">
            {currentTab === 'myMessages' ? '我的消息' : '系统通知'}
          </h2>
        </div>
        <div className="h-2 bg-gray-100" />
        <div className="flex flex-1 min-h-0">
          {currentTab === 'myMessages' && (
            <>
              <div className="flex flex-col w-[240px] bg-white border-r border-gray-200 min-h-0">
                <div className="py-[0.2rem] px-4 border-b border-gray-200 flex-none">
                  <h2 className="text-sm">最近消息</h2>
                </div>
                <div className="flex-1 min-h-0">
                  <ConversationList
                    conversations={conversations}
                    loading={loading}
                    selectedId={selectedConversation}
                    onSelect={handleConversationSelect}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
              <div className="flex-1 min-h-0 bg-white">
                <MessageArea
                  conversationId={selectedConversation}
                />
              </div>
            </>
          )}
          {currentTab === 'system' && (
            <div className="flex-1 flex flex-col bg-gray-50">
              <div className="flex-1 flex items-center justify-center">
                <Empty
                  image={<InboxOutlined style={{ fontSize: '64px', color: '#bfbfbf' }} />}
                  imageStyle={{ marginBottom: '16px' }}
                  description={
                    <span className="text-gray-400 text-base">暂无系统通知</span>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatContainer; 