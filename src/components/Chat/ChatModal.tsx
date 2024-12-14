import React, { useEffect, useRef, useCallback } from 'react';
import { Modal } from 'antd';
import MessageArea from './MessageArea';
import { useMessages } from '@/hooks/useMessages';

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
  const mountedRef = useRef(true);
  const lastRefreshRef = useRef<number>(0);
  const { refetch } = useMessages(
    open ? conversationId : null
  );

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