import React, { useEffect, useRef, useCallback } from 'react';
import { Modal, Empty } from 'antd';
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

  return (
    <Modal
      open={open}
      onCancel={onClose}
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
      {open && conversationId ? (
        <MessageArea
          conversationId={conversationId}
          height="500px"
        />
      ) : (
        <div className="h-full flex items-center justify-center bg-gray-50">
          <Empty
            description={
              <span className="text-gray-400">
                无法加载会话
              </span>
            }
          />
        </div>
      )}
    </Modal>
  );
};

export default ChatModal; 