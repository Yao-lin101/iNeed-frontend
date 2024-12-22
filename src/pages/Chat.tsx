import React, { useEffect } from 'react';
import ChatContainer from '../components/Chat/ChatContainer';
import TaskDetailModal from '@/components/Task/TaskDetailModal';
import { useChatStore } from '@/store/useChatStore';

interface ChatProps {
  initialTab?: 'myMessages' | 'system';
}

const Chat: React.FC<ChatProps> = ({ initialTab = 'myMessages' }) => {
  const { setIsInMessageCenter } = useChatStore();

  // 设置 body 的 data-page 属性，用于特定样式
  useEffect(() => {
    document.body.setAttribute('data-page', 'message-center');
    setIsInMessageCenter(true);
    return () => {
      document.body.removeAttribute('data-page');
      setIsInMessageCenter(false);
    };
  }, []);

  return (
    <div className="h-full flex justify-center bg-[#f3f4f6]">
      <div className="w-full max-w-7xl h-full flex flex-col">
        {/* 移动端适配的消息中心 */}
        <div className="md:hidden h-full">
          <ChatContainer 
            initialTab={initialTab}
            isMobile={true}
          />
        </div>

        {/* 桌面端布局 */}
        <div className="hidden md:block h-full">
          <ChatContainer 
            initialTab={initialTab}
            isMobile={false}
          />
        </div>
      </div>
      <TaskDetailModal />
    </div>
  );
};

export default Chat; 