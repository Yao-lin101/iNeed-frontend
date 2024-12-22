import React, { useState, useEffect } from 'react';
import { Menu, Badge, Empty } from 'antd';
import {
  MessageOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import ConversationList from './ConversationList';
import MessageArea from './MessageArea';
import { useConversations } from '@/hooks/useConversations';
import SystemNotificationList from './SystemNotificationList';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWebSocketMessage } from '@/hooks/useWebSocketMessage';
import { MessageAreaProvider } from '@/contexts/MessageAreaContext';
import { useUnreadStore } from '@/store/useUnreadStore';

interface ChatContainerProps {
  initialConversationId?: number;
  initialTab?: 'myMessages' | 'system';
  isMobile?: boolean;
}

const ChatContainerInner: React.FC<ChatContainerProps> = ({ 
  initialConversationId,
  initialTab = 'myMessages',
  isMobile = false
}) => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(initialConversationId || null);
  const [currentTab, setCurrentTab] = useState(initialTab);
  const { conversations, loading, refetch: refetchConversations, updateUnreadCount, updateLocalUnreadCount } = useConversations();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadMessages: unreadMessagesCount, unreadNotifications } = useUnreadStore();

  // 移动端视图状态
  const [showMessageArea, setShowMessageArea] = useState(false);

  // 同步路由和标签状态
  useEffect(() => {
    const path = location.pathname;
    const newTab = path === '/mc/sm' ? 'system' : 'myMessages';
    
    // 只在标签真正改变时更新状态
    if (currentTab !== newTab) {
      setCurrentTab(newTab);
    }
  }, [location.pathname, currentTab]);

  // 处理标签页切换
  const handleTabChange = (key: 'myMessages' | 'system') => {
    // 只在标签真正改变时进行导航
    if (key !== currentTab) {
      if (key === 'system') {
        navigate('/mc/sm', { replace: true });
      } else {
        navigate('/mc/chat', { replace: true });
      }
    }
  };

  // 处理会话选择（移动端）
  const handleConversationSelect = (conversationId: number | null) => {
    setSelectedConversation(conversationId);
    if (isMobile && conversationId) {
      setShowMessageArea(true);
    }
  };

  // 处理返回到会话列表（仅移动端）
  const handleBackToList = () => {
    setShowMessageArea(false);
  };

  // 换到系统通知标签时，清除选中的会话
  useEffect(() => {
    if (currentTab === 'system') {
      setSelectedConversation(null);
    }
  }, [currentTab]);

  // 处理 WebSocket 消息
  useWebSocketMessage({
    handleChatMessage: (message) => {
      if (message.shouldCountAsUnread) {
        refetchConversations();
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
          count={currentTab === 'system' ? 0 : unreadNotifications} 
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

  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* 移动端标题栏 - 调整 Menu 样式 */}
        <div className="flex-none border-b border-gray-200">
          <Menu
            mode="horizontal"
            selectedKeys={[currentTab]}
            items={menuItems}
            onClick={({ key }) => handleTabChange(key as 'myMessages' | 'system')}
            className="w-full !border-0 mobile-menu"
            style={{
              justifyContent: 'space-around',
              minWidth: 'auto'
            }}
          />
        </div>

        {/* 移动端内容区域 */}
        <div className="flex-1 overflow-hidden">
          {currentTab === 'myMessages' && (
            <>
              {/* 会话列表 */}
              <div className={`h-full ${showMessageArea ? 'hidden' : 'block'}`}>
                <ConversationList
                  conversations={conversations}
                  loading={loading}
                  selectedId={selectedConversation}
                  onSelect={handleConversationSelect}
                  onDelete={refetchConversations}
                  updateUnreadCount={updateUnreadCount}
                  updateLocalUnreadCount={updateLocalUnreadCount}
                />
              </div>

              {/* 消息区域 */}
              <div className={`h-full ${showMessageArea ? 'block' : 'hidden'}`}>
                {selectedConversation ? (
                  <MessageArea
                    conversationId={selectedConversation}
                    recipientName={conversations.find(c => c.id === selectedConversation)?.other_participant?.username}
                    onBack={handleBackToList}
                    isMobile={true}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <Empty description="选择一个会话开始聊天" />
                  </div>
                )}
              </div>
            </>
          )}
          
          {currentTab === 'system' && (
            <SystemNotificationList 
              onNotificationRead={refetchConversations}
              isMobile={true}
            />
          )}
        </div>
      </div>
    );
  }

  // 返回原有的桌面端布局
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
                    updateUnreadCount={updateUnreadCount}
                    updateLocalUnreadCount={updateLocalUnreadCount}
                  />
                </div>
                <div className="h-3 bg-gray-100"></div>
              </div>
              <div className="flex-1 min-h-0 bg-white flex flex-col">
                <div className="flex-1 min-h-0">
                  {selectedConversation ? (
                    <MessageArea
                      conversationId={selectedConversation}
                      recipientName={conversations.find(c => c.id === selectedConversation)?.other_participant?.username}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50">
                      <Empty
                        description={
                          <span className="text-gray-400">
                            选择一个会话开始聊天
                          </span>
                        }
                      />
                    </div>
                  )}
                </div>
                <div className="h-3 bg-gray-100"></div>
              </div>
            </>
          )}
          {currentTab === 'system' && (
            <div className="flex-1 flex flex-col bg-white">
              <SystemNotificationList 
                onNotificationRead={refetchConversations}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatContainer: React.FC<ChatContainerProps> = (props) => {
  return (
    <MessageAreaProvider>
      <ChatContainerInner {...props} />
    </MessageAreaProvider>
  );
};

export default ChatContainer; 