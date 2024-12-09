import React from 'react';
import { useLocation } from 'react-router-dom';
import ChatContainer from '../components/Chat/ChatContainer';

interface LocationState {
  conversationId?: number;
}

const Chat: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;

  return (
    <div className="h-[calc(100vh-64px)] flex justify-center bg-gray-100">
      <div className="w-[1100px] min-w-[1100px]">
        <ChatContainer initialConversationId={state?.conversationId} />
      </div>
    </div>
  );
};

export default Chat; 