import { create } from 'zustand';
import { Message } from '@/types/chat';

interface MessageState {
  // 消息缓存: conversationId -> Message[]
  messages: Map<number, Message[]>;
  syncTimes: Map<number, string>;  // 会话ID -> 最后同步时间
  // 记录每个会话的分页信息
  pagination: Map<number, {
    total: number;
    currentPage: number;
    hasMore: boolean;
  }>;
  
  // 添加单条消息
  addMessage: (conversationId: number, message: Message) => void;
  
  // 获取会话的消息列表
  getMessages: (conversationId: number) => Message[];
  
  // 批量更新消息
  updateMessages: (conversationId: number, messages: Message[]) => void;
  
  // 清除指定会话的消息
  clearMessages: (conversationId: number) => void;
  
  // 清除所有消息
  clearAllMessages: () => void;
  
  // 获取会话的最后同步时间
  getLastSyncTime: (conversationId: number) => string | null;
  
  // 更新会话的同步时间
  updateSyncTime: (conversationId: number, syncTime: string) => void;
  
  // 更新分页信息
  updatePagination: (conversationId: number, info: {
    total: number;
    currentPage: number;
    hasMore: boolean;
  }) => void;
  
  // 获取分页信息
  getPagination: (conversationId: number) => {
    total: number;
    currentPage: number;
    hasMore: boolean;
  } | null;
  
  // 清除会话的同步时间
  clearSyncTime: (conversationId: number) => void;
  
  // 清除会话的分页信息
  clearPagination: (conversationId: number) => void;
  
  // 清除会话的消息
  cleanupConversation: (conversationId: number) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: new Map(),
  syncTimes: new Map(),
  pagination: new Map(),
  
  addMessage: (conversationId, message) => {
    set(state => {
      const newMessages = new Map(state.messages);
      const conversationMessages = newMessages.get(conversationId) || [];
      // 检查消息是否已存在
      if (!conversationMessages.find(m => m.id === message.id)) {
        newMessages.set(conversationId, [...conversationMessages, message]);
      }
      return { messages: newMessages };
    });
  },
  
  getMessages: (conversationId) => {
    return get().messages.get(conversationId) || [];
  },
  
  updateMessages: (conversationId, messages) => {
    set(state => {
      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, messages);
      return { messages: newMessages };
    });
  },
  
  clearMessages: (conversationId) => {
    set(state => {
      const newMessages = new Map(state.messages);
      newMessages.delete(conversationId);
      return { messages: newMessages };
    });
  },
  
  clearAllMessages: () => {
    set({ messages: new Map() });
  },
  
  getLastSyncTime: (conversationId) => {
    return get().syncTimes.get(conversationId) || null;
  },
  
  updateSyncTime: (conversationId, syncTime) => {
    set(state => {
      const newSyncTimes = new Map(state.syncTimes);
      newSyncTimes.set(conversationId, syncTime);
      return { syncTimes: newSyncTimes };
    });
  },
  
  // 更新分页信息
  updatePagination: (conversationId, info) => {
    set(state => {
      const newPagination = new Map(state.pagination);
      newPagination.set(conversationId, info);
      return { pagination: newPagination };
    });
  },
  
  // 获取分页信息
  getPagination: (conversationId) => {
    return get().pagination.get(conversationId) || null;
  },
  
  // 清除会话的同步时间
  clearSyncTime: (conversationId) => {
    set(state => {
      const newSyncTimes = new Map(state.syncTimes);
      newSyncTimes.delete(conversationId);
      return { syncTimes: newSyncTimes };
    });
  },
  
  // 清除会话的分页信息
  clearPagination: (conversationId) => {
    set(state => {
      const newPagination = new Map(state.pagination);
      newPagination.delete(conversationId);
      return { pagination: newPagination };
    });
  },
  
  // 清除会话的消息
  cleanupConversation: (conversationId: number) => {
    set(state => {
      const newMessages = new Map(state.messages);
      const newSyncTimes = new Map(state.syncTimes);
      const newPagination = new Map(state.pagination);
      
      newMessages.delete(conversationId);
      newSyncTimes.delete(conversationId);
      newPagination.delete(conversationId);
      
      return {
        messages: newMessages,
        syncTimes: newSyncTimes,
        pagination: newPagination
      };
    });
  },
})); 