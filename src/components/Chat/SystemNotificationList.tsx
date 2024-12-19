import React, { useEffect, useState, useCallback } from 'react';
import { List, Badge, Spin, Empty, Button, message } from 'antd';
import { BellOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { systemMessageService, SystemNotification } from '@/services/systemMessageService';
import { useTaskStore } from '@/models/TaskModel';
import dayjs from 'dayjs';
import '@/styles/components/chat/system-notification.css';
import { useWebSocketMessage } from '@/hooks/useWebSocketMessage';
import { useUnreadStore } from '@/store/useUnreadStore';

interface SystemNotificationListProps {
  onNotificationRead?: () => void;
}

const SystemNotificationList: React.FC<SystemNotificationListProps> = ({
  onNotificationRead
}) => {
  const { loadTaskDetail, setModalVisible, setModalContext } = useTaskStore();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { setUnreadNotifications } = useUnreadStore();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await systemMessageService.getNotifications({
        page: currentPage
      });
      setNotifications(response.results);
      setTotal(response.count);
    } catch (error) {
      message.error('获取系统通知失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  // 监听刷新事件
  useEffect(() => {
    const handleRefresh = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (!customEvent.detail) return;

      const { type, data } = customEvent.detail;
      
      if (type === 'notification' && data.unread_count !== undefined) {
        // 如果是标记已读的消息，只更新本地状态
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } else if (type === 'new_notification' && data.id) {
        // 如果是新通知，添加到列表开头
        const newNotification: SystemNotification = {
          id: data.id,
          type: data.type,
          title: data.title,
          content: data.content,
          metadata: data.metadata,
          is_read: false,
          created_at: data.created_at
        };
        setNotifications(prev => {
          // 检查通知是否已存在
          if (prev.some(n => n.id === data.id)) {
            return prev;
          }
          return [newNotification, ...prev];
        });
        setTotal(prev => prev + 1);
      }
    };

    window.addEventListener('refresh-notifications', handleRefresh);
    return () => {
      window.removeEventListener('refresh-notifications', handleRefresh);
    };
  }, []);

  // 计算未读数量
  const calculateUnreadCount = useCallback((excludeId?: number) => {
    return notifications.filter(n => 
      !n.is_read && (excludeId ? n.id !== excludeId : true)
    ).length;
  }, [notifications]);

  // 监听新通知事件
  useWebSocketMessage({
    handleNotification: useCallback((data: any) => {
      console.log('SystemNotificationList - Received notification data:', data);

      // 检查是否是有效的通知数据
      if (data && data.id && data.type && data.title) {
        setNotifications(prev => {
          // 检查通知是否已存在
          if (prev.some(n => n.id === data.id)) {
            return prev;
          }
          // 添加新通知到列表开头
          return [data, ...prev];
        });
        
        // 更新未读数 - 计算当前未读数量加1
        setUnreadNotifications(calculateUnreadCount() + 1);
      }
    }, [calculateUnreadCount, setUnreadNotifications])
  });

  const handleMarkAllRead = async () => {
    try {
      await systemMessageService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotifications(0);
      message.success('已全部标记为已读');
      onNotificationRead?.();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleViewTask = async (taskId: number, notificationId: number) => {
    try {
      const targetNotification = notifications.find(n => n.id === notificationId);
      if (targetNotification && !targetNotification.is_read) {
        await systemMessageService.markAsRead(notificationId);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        const unreadCount = calculateUnreadCount(notificationId);
        setUnreadNotifications(unreadCount);
        onNotificationRead?.();
      }

      setModalContext('notification');
      await loadTaskDetail(taskId);
      setModalVisible(true);
    } catch (error) {
      message.error('加载任务详情失败');
    }
  };

  const renderNotification = (notification: SystemNotification) => {
    const isTaskNotification = notification.type.startsWith('task_');
    const taskId = isTaskNotification ? notification.metadata?.task_id : null;

    return (
      <List.Item
        className={`system-notification-item ${!notification.is_read ? 'unread' : ''}`}
        onClick={async () => {
          if (!notification.is_read) {
            try {
              await systemMessageService.markAsRead(notification.id);
              setNotifications(prev =>
                prev.map(n =>
                  n.id === notification.id ? { ...n, is_read: true } : n
                )
              );
              onNotificationRead?.();
              const unreadCount = calculateUnreadCount(notification.id);
              setUnreadNotifications(unreadCount);
            } catch (error) {
              console.error('标记已读失败:', error);
              message.error('标记已读失败');
            }
          }
        }}
      >
        <div className="flex items-center w-full gap-4">
          <div className="notification-icon">
            <Badge dot={!notification.is_read}>
              <BellOutlined />
            </Badge>
          </div>
          <div className="notification-content flex-1">
            <div className="notification-title">{notification.title}</div>
            <div className="notification-message">{notification.content}</div>
            <div className="notification-time text-gray-400 text-sm">
              {dayjs(notification.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </div>
          {isTaskNotification && taskId && (
            <div className="flex items-center">
              <Button
                type="link"
                size="small"
                className="view-task-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewTask(taskId, notification.id);
                }}
              >
                查看任务 <ArrowRightOutlined />
              </Button>
            </div>
          )}
        </div>
      </List.Item>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无系统通知"
      />
    );
  }

  return (
    <div className="system-notification-list">
      <div className="p-4 border-b flex justify-between items-center">
        <span className="text-gray-500">系统通知</span>
        <Button type="link" className="mark-all-read-button" onClick={handleMarkAllRead}>
          全部标记为已读
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <List
          dataSource={notifications}
          renderItem={renderNotification}
          pagination={{
            current: currentPage,
            total: total,
            onChange: setCurrentPage,
            pageSize: 20
          }}
        />
      </div>
      <div className="h-3 bg-gray-100"></div>
    </div>
  );
};

export default SystemNotificationList; 