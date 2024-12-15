import React from 'react';
import ChatContainer from '../components/Chat/ChatContainer';
import TaskDetailModal from '@/components/Task/TaskDetailModal';

interface ChatProps {
  initialTab?: 'myMessages' | 'system';
}

const Chat: React.FC<ChatProps> = ({ initialTab = 'myMessages' }) => {

  return (
    <div className="h-[calc(100vh-64px)] flex justify-center bg-gray-100">
      <div className="w-[1100px] min-w-[1100px]">
        <ChatContainer 
          initialTab={initialTab}
        />
      </div>
      <TaskDetailModal />
    </div>
  );
};

export default Chat; 