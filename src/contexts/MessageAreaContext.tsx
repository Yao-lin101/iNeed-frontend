import React, { createContext, useContext, useState, useCallback } from 'react';
import { useChatStore } from '@/store/useChatStore';

interface MessageAreaContextType {
  activeConversationId: number | null;
  setActiveConversation: (id: number | null) => void;
}

const MessageAreaContext = createContext<MessageAreaContextType | null>(null);

export const MessageAreaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const { setActiveConversationId: setStoreActiveConversationId } = useChatStore();

  const setActiveConversation = useCallback((id: number | null) => {
    console.log('MessageAreaContext - Setting active conversation:', id);
    setActiveConversationId(id);
    setStoreActiveConversationId(id);
  }, []);

  return (
    <MessageAreaContext.Provider value={{ 
      activeConversationId, 
      setActiveConversation 
    }}>
      {children}
    </MessageAreaContext.Provider>
  );
};

export const useMessageArea = () => {
  const context = useContext(MessageAreaContext);
  if (!context) {
    throw new Error('useMessageArea must be used within a MessageAreaProvider');
  }
  return context;
}; 