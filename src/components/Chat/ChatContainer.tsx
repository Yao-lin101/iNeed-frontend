import React, { useState, useEffect } from 'react';
import {  Menu } from 'antd';
import {
  MessageOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import ConversationList from './ConversationList';
import MessageArea from './MessageArea';
import { useConversations } from '@/hooks/useConversations';


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
    <div className="flex h-full">
      <div className="w-[180px] bg-white">
        <div className="py-[0.2rem] px-4 border-b border-gray-200">
          <h2 className="text-sm">消息中心</h2>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentTab]}
          items={menuItems}
          onClick={({ key }) => setCurrentTab(key)}
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
                    onSelect={setSelectedConversation}
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
            <div className="h-full flex items-center justify-center text-gray-500 bg-white">
              暂无系统通知
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatContainer; 