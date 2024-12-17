import { create } from 'zustand';

interface ChatState {
  // 聊天上下文
  chatContext: {
    isInMessageCenter: boolean;
    activeConversationId: number | null;
    chatModalVisible: boolean;
  };
  
  // 设置方法
  setIsInMessageCenter: (value: boolean) => void;
  setActiveConversationId: (id: number | null) => void;
  setChatModalVisible: (visible: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // 初始状态
  chatContext: {
    isInMessageCenter: false,
    activeConversationId: null,
    chatModalVisible: false,
  },

  // 设置方法
  setIsInMessageCenter: (value) => 
    set((state) => ({
      chatContext: { ...state.chatContext, isInMessageCenter: value }
    })),

  setActiveConversationId: (id) => {
    set((state) => ({
      chatContext: { ...state.chatContext, activeConversationId: id }
    }));
  },

  setChatModalVisible: (visible) =>
    set((state) => ({
      chatContext: { ...state.chatContext, chatModalVisible: visible }
    })),
})); 