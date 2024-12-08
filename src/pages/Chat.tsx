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
    <div className="h-screen">
      <ChatContainer initialConversationId={state?.conversationId} />
    </div>
  );
};

export default Chat; 