import React from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import ChatContainer from '../components/Chat/ChatContainer';
import TaskDetailModal from '@/components/Task/TaskDetailModal';

interface ChatProps {
  initialTab?: 'myMessages' | 'system';
}

const Chat: React.FC<ChatProps> = ({ initialTab = 'myMessages' }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // 只在 /mc/chat 路径下才读取 conversation 参数
  const conversationId = location.pathname === '/mc/chat' 
    ? searchParams.get('conversation') 
    : null;
  const initialConversationId = conversationId ? parseInt(conversationId, 10) : undefined;

  return (
    <div className="h-[calc(100vh-64px)] flex justify-center bg-gray-100">
      <div className="w-[1100px] min-w-[1100px]">
        <ChatContainer 
          initialConversationId={initialConversationId} 
          initialTab={initialTab}
        />
      </div>
      <TaskDetailModal />
    </div>
  );
};

export default Chat; 