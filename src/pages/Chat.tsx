import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatContainer from '../components/Chat/ChatContainer';
import TaskDetailModal from '@/components/Task/TaskDetailModal';

interface ChatProps {
  initialTab?: 'myMessages' | 'system';
}

const Chat: React.FC<ChatProps> = ({ initialTab = 'myMessages' }) => {
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');
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