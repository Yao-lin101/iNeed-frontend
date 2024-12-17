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
import { systemMessageService } from '@/services/systemMessageService';
import { useWebSocketMessage } from '@/hooks/useWebSocketMessage';
import { useMessageArea } from '@/contexts/MessageAreaContext';
import { MessageAreaProvider } from '@/contexts/MessageAreaContext';

interface ChatContainerProps {
  initialConversationId?: number;
  initialTab?: 'myMessages' | 'system';
}

const ChatContainerInner: React.FC<ChatContainerProps> = ({ 
  initialConversationId,
  initialTab = 'myMessages'
}) => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(initialConversationId || null);
  const [currentTab, setCurrentTab] = useState(initialTab);
  const { conversations, loading, refetch: refetchConversations, updateUnreadCount } = useConversations();
  const { setActiveConversation } = useMessageArea();
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
    // 设置初始活跃会话
    if (initialConversationId) {
      setActiveConversation(initialConversationId);
    }
  }, [initialConversationId, setActiveConversation]);

  // 同步路由和标签状态
  useEffect(() => {
    const path = location.pathname;
    const newTab = path === '/mc/sm' ? 'system' : 'myMessages';
    
    // 只在标签真正改变时更新状态
    if (currentTab !== newTab) {
      console.log('标签切换:', { from: currentTab, to: newTab });
      setCurrentTab(newTab);
      
      // 在系统通知标签页时清除会话选择
      if (newTab === 'system') {
        setSelectedConversation(null);
        setActiveConversation(null);
      }
    }
  }, [location.pathname, currentTab, setActiveConversation]);

  // 处理标签页切换
  const handleTabChange = (key: 'myMessages' | 'system') => {
    // 只在标签真正改变时进行导航
    if (key !== currentTab) {
      if (key === 'system') {
        setSelectedConversation(null);
        setActiveConversation(null);
        navigate('/mc/sm', { replace: true });
      } else {
        navigate('/mc/chat', { replace: true });
      }
    }
  };

  // 处理会话选择
  const handleConversationSelect = (conversationId: number | null) => {
    setSelectedConversation(conversationId);
    setActiveConversation(conversationId);
  };

  // 当切换到系统通知标签时，清除选中的会话
  useEffect(() => {
    if (currentTab === 'system') {
      setSelectedConversation(null);
      setActiveConversation(null);
    }
  }, [currentTab, setActiveConversation]);

  // 处理 WebSocket 消息
  useWebSocketMessage({
    handleChatMessage: (message) => {
      if (message.shouldCountAsUnread) {
        setUnreadMessagesCount(prev => prev + 1);
        refetchConversations();
      }
    },
    handleNotification: (data) => {
      console.log('开始处理通知:', data);
      const message = data;  // data 本身就是消息，不需要 data.message
      if (!message) {
        console.warn('无效的通知格式:', data);
        return;
      }

      console.log('处理系统通知:', {
        message,
        currentTab,
        type: message.type,
        id: message.id
      });

      if (message.id && (message.type.startsWith('task_') || message.type === 'system_notification')) {
        console.log('有效的系统通知:', {
          id: message.id,
          type: message.type,
          title: message.title
        });

        // 触发刷新事件
        window.dispatchEvent(new CustomEvent('refresh-notifications', {
          detail: { 
            type: 'new_notification',
            data: {
              id: message.id,
              type: message.type,
              title: message.title,
              content: message.content,
              metadata: message.metadata,
              is_read: false,
              created_at: message.created_at || new Date().toISOString()
            }
          }
        }));

        // 只有不在系统通知标签页时才增加未读计数
        if (currentTab !== 'system') {
          console.log('不在系统通知标签页，增加未读计数');
          setUnreadNotificationCount(prev => {
            console.log('更新未读计数:', prev, '->', prev + 1);
            return prev + 1;
          });
        } else {
          console.log('在系统通知标签页，不增加未读计数');
        }

        // 收到通知后，刷新一次未读计数
        console.log('开始刷新未读计数');
        fetchUnreadNotificationCount().then(() => {
          console.log('未读计数刷新完成');
        }).catch(error => {
          console.error('刷新未读计数失败:', error);
        });
      } else if (message.unread_count !== undefined) {
        // 如果收到未读计数更新
        console.log('收到未读计数更新:', {
          currentTab,
          unreadCount: message.unread_count
        });

        if (currentTab !== 'system') {
          console.log('设置系统通知未读数为:', message.unread_count);
          setUnreadNotificationCount(message.unread_count);
        } else {
          console.log('在系统通知标签页，清零未读计数');
          setUnreadNotificationCount(0);
        }
      } else {
        console.log('不是系统通知也不是未读计数更新:', message);
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
                    updateUnreadCount={updateUnreadCount}
                  />
                </div>
                <div className="h-3 bg-gray-100"></div>
              </div>
              <div className="flex-1 min-h-0 bg-white flex flex-col">
                <div className="flex-1 min-h-0">
                  {selectedConversation ? (
                    <MessageArea
                      conversationId={selectedConversation}
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
                onNotificationRead={fetchUnreadNotificationCount}
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