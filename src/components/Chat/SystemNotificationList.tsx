import React, { useEffect, useState } from 'react';
import { List, Badge, Spin, Empty, Button, message } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { systemMessageService, SystemNotification } from '@/services/systemMessageService';
import dayjs from 'dayjs';

interface SystemNotificationListProps {
  onNotificationRead?: () => void;
}

const SystemNotificationList: React.FC<SystemNotificationListProps> = ({
  onNotificationRead
}) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

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
    const handleRefresh = () => {
      fetchNotifications();
    };
    window.addEventListener('refresh-notifications', handleRefresh);
    return () => {
      window.removeEventListener('refresh-notifications', handleRefresh);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await systemMessageService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      message.success('已全部标记为已读');
      onNotificationRead?.();
      window.dispatchEvent(new CustomEvent('ws-message', {
        detail: {
          type: 'notification',
          message: {
            type: 'notification',
            unread_count: 0
          }
        }
      }));
    } catch (error) {
      message.error('操作失败');
    }
  };

  const renderNotification = (notification: SystemNotification) => {
    return (
      <List.Item
        className={`cursor-pointer transition-colors ${
          !notification.is_read ? 'bg-blue-50' : ''
        }`}
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
              const unreadCount = notifications.filter(n => n.id !== notification.id && !n.is_read).length;
              window.dispatchEvent(new CustomEvent('ws-message', {
                detail: {
                  type: 'notification',
                  message: {
                    type: 'notification',
                    unread_count: unreadCount
                  }
                }
              }));
            } catch (error) {
              console.error('标记已读失败:', error);
              message.error('标记已读失败');
            }
          }
        }}
      >
        <List.Item.Meta
          avatar={
            <Badge dot={!notification.is_read}>
              <BellOutlined className="text-lg text-blue-500" />
            </Badge>
          }
          title={notification.title}
          description={
            <div className="space-y-1">
              <div>{notification.content}</div>
              <div className="text-xs text-gray-400">
                {dayjs(notification.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </div>
            </div>
          }
        />
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
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <span className="text-gray-500">系统通知</span>
        <Button type="link" onClick={handleMarkAllRead}>
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
    </div>
  );
};

export default SystemNotificationList; 