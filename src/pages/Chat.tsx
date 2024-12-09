import React from 'react';
import { useLocation } from 'react-router-dom';
import ChatContainer from '../components/Chat/ChatContainer';
import { useUserWebSocket } from '@/hooks/useUserWebSocket';

interface LocationState {
  conversationId?: number;
}

const Chat: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  
  // 初始化用户专属 WebSocket 连接
  useUserWebSocket();

  return (
    <div className="h-[calc(100vh-64px)] flex justify-center bg-gray-100">
      <div className="w-[1100px] min-w-[1100px]">
        <ChatContainer initialConversationId={state?.conversationId} />
      </div>
    </div>
  );
};

export default Chat; 