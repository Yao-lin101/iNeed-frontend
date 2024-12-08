import React, { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import {
  MessageOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import ConversationList from './ConversationList';
import MessageArea from './MessageArea';
import { useConversations } from '@/hooks/useConversations';

const { Sider, Content } = Layout;

interface ChatContainerProps {
  initialConversationId?: number;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ initialConversationId }) => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(initialConversationId || null);
  const [currentTab, setCurrentTab] = useState('myMessages');
  const { conversations, loading } = useConversations();

  useEffect(() => {
    if (initialConversationId) {
      setSelectedConversation(initialConversationId);
    }
  }, [initialConversationId]);

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
    <Layout className="h-full bg-white">
      <Sider 
        width={280} 
        theme="light"
        className="border-r border-gray-200 h-full overflow-hidden flex flex-col"
      >
        <Menu
          mode="inline"
          selectedKeys={[currentTab]}
          items={menuItems}
          onClick={({ key }) => setCurrentTab(key)}
          className="border-0 flex-none"
        />
        <div className="flex-1 overflow-hidden">
          {currentTab === 'myMessages' && (
            <ConversationList
              conversations={conversations}
              loading={loading}
              selectedId={selectedConversation}
              onSelect={setSelectedConversation}
            />
          )}
          {currentTab === 'system' && (
            <div className="p-4 text-center text-gray-500">
              暂无系统通知
            </div>
          )}
        </div>
      </Sider>
      <Content className="h-full">
        {currentTab === 'myMessages' && (
          <MessageArea
            conversationId={selectedConversation}
          />
        )}
        {currentTab === 'system' && (
          <div className="h-full flex items-center justify-center text-gray-500">
            暂无系统通知
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default ChatContainer; 