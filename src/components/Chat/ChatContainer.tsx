import React, { useState, useEffect } from 'react';
import { Menu, Badge } from 'antd';
import {
  MessageOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import ConversationList from './ConversationList';
import MessageArea from './MessageArea';
import { useConversations } from '@/hooks/useConversations';
import SystemNotificationList from './SystemNotificationList';
import { useNavigate, useLocation } from 'react-router-dom';
import { systemMessageService } from '@/services/systemMessageService';
import { useWebSocketMessage } from '@/hooks/useWebSocketMessage';

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
  const { conversations, loading, refetch: refetchConversations } = useConversations();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // 更新未读消息计数
  useEffect(() => {
    const count = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    setUnreadMessagesCount(count);
  }, [conversations]);

  // 获取未读通知数量
  const fetchUnreadNotificationCount = async () => {
    try {
      const response = await systemMessageService.getUnreadCount();
      setUnreadNotificationCount(response.count);
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
    }
  };

  // 初始化
  useEffect(() => {
    fetchUnreadNotificationCount();
  }, []);

  // 同步路由和标签状态
  useEffect(() => {
    const path = location.pathname;
    const newTab = path === '/mc/sm' ? 'system' : 'myMessages';
    
    if (currentTab !== newTab) {
      setCurrentTab(newTab);
      if (newTab === 'system') {
        setSelectedConversation(null);
      }
    }
  }, [location.pathname]);

  // 处理标签页切换
  const handleTabChange = (key: 'myMessages' | 'system') => {
    if (key === 'system') {
      setSelectedConversation(null);
      setTimeout(() => {
        navigate('/mc/sm');
      }, 0);
    } else {
      navigate('/mc/chat');
    }
  };

  // 处理会话选择
  const handleConversationSelect = (conversationId: number | null) => {
    setSelectedConversation(conversationId);
  };

  // 处理 WebSocket 消息
  useWebSocketMessage({
    handleNotification: (data) => {
      const message = data.message;
      if (!message) return;

      // 更新未读通知计数
      if (message.unread_count !== undefined) {
        // 如果不在系统通知标签页，才更新未读计数
        if (currentTab !== 'system') {
          setUnreadNotificationCount(message.unread_count);
        } else {
          setUnreadNotificationCount(0);
        }
      }

      // 如果在系统通知页面，刷新列表
      if (currentTab === 'system') {
        window.dispatchEvent(new Event('refresh-notifications'));
      }
    }
  });

  const menuItems = [
    {
      key: 'myMessages',
      icon: (
        <Badge 
          count={currentTab === 'myMessages' ? 0 : unreadMessagesCount} 
          offset={[90, 8]}
          className="unread-badge"
        >
          <MessageOutlined style={{ fontSize: '16px' }} />
        </Badge>
      ),
      label: '我的消息',
      className: 'menu-item-with-icon'
    },
    {
      key: 'system',
      icon: (
        <Badge 
          count={currentTab === 'system' ? 0 : unreadNotificationCount} 
          offset={[90, 8]}
          className="unread-badge"
        >
          <NotificationOutlined style={{ fontSize: '16px' }} />
        </Badge>
      ),
      label: '系统通知',
      className: 'menu-item-with-icon'
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
                    onDelete={refetchConversations}
                  />
                </div>
                <div className="h-3 bg-gray-100"></div>
              </div>
              <div className="flex-1 min-h-0 bg-white flex flex-col">
                <div className="flex-1 min-h-0">
                  <MessageArea
                    conversationId={selectedConversation}
                  />
                </div>
                <div className="h-3 bg-gray-100"></div>
              </div>
            </>
          )}
          {currentTab === 'system' && (
            <div className="flex-1 flex flex-col bg-white">
              <SystemNotificationList 
                onNotificationRead={fetchUnreadNotificationCount}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatContainer; 