import { create } from 'zustand';
import { chatService } from '@/services/chatService';
import { systemMessageService } from '@/services/systemMessageService';
import { Conversation } from '@/types/chat';

interface UnreadState {
  totalUnread: number;
  unreadMessages: number;
  unreadNotifications: number;
  syncUnreadCounts: () => Promise<void>;
  setUnreadMessages: (count: number) => void;
  setUnreadNotifications: (count: number) => void;
  incrementUnreadMessages: () => void;
  decrementUnreadMessages: (count: number) => void;
  incrementUnreadNotifications: () => void;
}

export const useUnreadStore = create<UnreadState>((set) => ({
  totalUnread: 0,
  unreadMessages: 0,
  unreadNotifications: 0,

  setUnreadMessages: (count: number) => 
    set(state => ({ 
      unreadMessages: count,
      totalUnread: count + state.unreadNotifications 
    })),

  setUnreadNotifications: (count: number) => 
    set(state => ({ 
      unreadNotifications: count,
      totalUnread: state.unreadMessages + count 
    })),

  incrementUnreadMessages: () => 
    set(state => {
      console.log('[useUnreadStore] Incrementing unread messages:', {
        before: state.unreadMessages,
        after: state.unreadMessages + 1
      });
      return { 
        unreadMessages: state.unreadMessages + 1,
        totalUnread: state.totalUnread + 1 
      };
    }),

  decrementUnreadMessages: (count: number) => 
    set(state => ({ 
      unreadMessages: Math.max(0, state.unreadMessages - count),
      totalUnread: Math.max(0, state.totalUnread - count)
    })),

  incrementUnreadNotifications: () => 
    set(state => {
      console.log('[useUnreadStore] Incrementing unread notifications:', {
        before: state.unreadNotifications,
        after: state.unreadNotifications + 1
      });
      return { 
        unreadNotifications: state.unreadNotifications + 1,
        totalUnread: state.totalUnread + 1 
      };
    }),

  syncUnreadCounts: async () => {
    try {
      console.log('[useUnreadStore] Starting sync unread counts');
      const [conversationsResponse, notificationsResponse] = await Promise.all([
        chatService.getConversations(),
        systemMessageService.getUnreadCount()
      ]);

      const unreadMessages = conversationsResponse.results.reduce(
        (sum: number, conv: Conversation) => sum + (conv.unread_count || 0), 
        0
      );

      console.log('[useUnreadStore] Syncing counts:', {
        unreadMessages,
        unreadNotifications: notificationsResponse.count,
        totalUnread: unreadMessages + notificationsResponse.count
      });

      set({
        unreadMessages,
        unreadNotifications: notificationsResponse.count,
        totalUnread: unreadMessages + notificationsResponse.count
      });
    } catch (error) {
      console.error('[useUnreadStore] Failed to sync unread counts:', error);
    }
  },
})); 