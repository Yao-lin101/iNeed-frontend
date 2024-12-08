import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  MessageOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import ConversationList from './ConversationList';
import MessageArea from './MessageArea';
import { useConversations } from '@/hooks/useConversations';

const { Sider, Content } = Layout;

const ChatContainer: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState('myMessages');
  const { conversations, loading } = useConversations();

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
    <Layout className="h-full">
      <div className="w-full bg-white p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium m-0">消息中心</h2>
      </div>
      <Layout className="bg-white">
        <Sider 
          width={300} 
          theme="light"
          className="border-r border-gray-200"
        >
          <Menu
            mode="inline"
            selectedKeys={[currentTab]}
            items={menuItems}
            onClick={({ key }) => setCurrentTab(key)}
            className="border-0"
          />
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
        </Sider>
        <Content>
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
    </Layout>
  );
};

export default ChatContainer; 