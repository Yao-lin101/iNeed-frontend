import React, { useEffect, useRef, useCallback } from 'react';
import { Modal } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import MessageArea from './MessageArea';
import { useMessages } from '@/hooks/useMessages';
import { chatService } from '@/services/chatService';
import { useWebSocketMessage, MessageContext } from '@/hooks/useWebSocketMessage';

interface ChatModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: number | null;
  recipientName: string;
  zIndex?: number;
}

const ChatModal: React.FC<ChatModalProps> = ({
  open,
  onClose,
  conversationId,
  zIndex
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const mountedRef = useRef(true);
  const lastRefreshRef = useRef<number>(0);
  const { refetch } = useMessages(
    open ? conversationId : null
  );

  // 处理 URL 更新
  useEffect(() => {
    if (open && conversationId) {
      // 打开模态框时,添加会话 ID 到 URL
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('conversation', conversationId.toString());
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    } else {
      // 关闭模态框时,移除会话 ID
      const searchParams = new URLSearchParams(location.search);
      searchParams.delete('conversation');
      navigate(`${location.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`, { replace: true });
    }
  }, [open, conversationId, navigate, location.pathname, location.search]);

  // 设置挂载状态
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 处理消息刷新
  const handleRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current > 2000) {
      lastRefreshRef.current = now;
      refetch();
    }
  }, [refetch]);

  // 监听对话状态变化
  useEffect(() => {
    if (!mountedRef.current) return;

    if (open && conversationId) {
      handleRefresh();
    }
  }, [open, conversationId, handleRefresh]);

  // 处理模态框关闭
  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (open && conversationId) {
      chatService.markAsRead(conversationId).catch(error => {
        console.error('标记已读失败:', error);
      });
    }
  }, [open, conversationId]);

  // 添加未读状态监听
  useEffect(() => {
    if (open && conversationId) {
      // 打开模态框时自动标记已读
      chatService.markAsRead(conversationId).catch(error => {
        console.error('标记已读失败:', error);
      });
    }
  }, [open, conversationId]);

  // 处理新消息
  const handleChatMessage = useCallback((context: MessageContext) => {
    if (!open || !conversationId) return;
    
    const { message } = context;
    // 如果是当前会话的新消息，立即标记为已读
    if (message.conversation === conversationId) {
      chatService.markAsRead(conversationId).catch(error => {
        console.error('标记已读失败:', error);
      });
    }
  }, [open, conversationId]);

  // 使用 WebSocket 消息处理中心
  useWebSocketMessage({
    handleChatMessage,
  });

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      zIndex={zIndex}
      width={600}
      styles={{
        body: {
          height: '500px',
          padding: 0,
          overflow: 'hidden'
        }
      }}
      destroyOnClose
    >
      <MessageArea
        conversationId={open ? conversationId : null}
        height="500px"
      />
    </Modal>
  );
};

export default ChatModal; 