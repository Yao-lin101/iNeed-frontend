import React, { useEffect, useState } from 'react';
import { Modal, Card, Button, message, Spin, Tag, Avatar } from 'antd';
import { 
  DownloadOutlined, 
  ExclamationCircleOutlined, 
  UserOutlined,
  MessageOutlined 
} from '@ant-design/icons';
import { useAuthStore } from '@/store/useAuthStore';
import { taskService, Task, TaskSubmitData } from '@/services/taskService';
import { chatService } from '@/services/chatService';
import { request } from '@/utils/request';
import TaskSubmitModal from '../TaskSubmitModal';
import TaskReviewModal from '../TaskReviewModal';
import ChatModal from '@/components/Chat/ChatModal';
import { getMediaUrl } from '@/utils/url';
import { formatDeadline } from '@/utils/date';

interface TaskDetailModalProps {
  open: boolean;
  taskId: number | null;
  onClose: () => void;
  onStatusChange?: () => void; // 可选的回调函数，用于通知父组件任务状态变化
}

const { confirm } = Modal;

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  open,
  taskId,
  onClose,
  onStatusChange
}) => {
  const { user } = useAuthStore();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);

  const isCreator = task?.creator.uid === user?.uid;
  const isAssignee = task?.assignee?.uid === user?.uid;

  // 获取状态标签的颜色
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'default',
      in_progress: 'processing',
      submitted: 'warning',
      completed: 'success',
      rejected: 'error',
      cancelled: 'error',
      system_cancelled: 'error',
      expired: 'error'
    };
    return colorMap[status] || 'default';
  };

  // 获取状态的中文描述
  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      pending: '待接取',
      in_progress: '进行中',
      submitted: '待审核',
      completed: '已完成',
      rejected: '已拒绝',
      cancelled: '已取消',
      system_cancelled: '系统取消',
      expired: '已过期'
    };
    return textMap[status] || status;
  };

  // 加载任务详情
  const loadTask = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      const data = await taskService.getTask(taskId);
      setTask(data);
    } catch (error) {
      message.error('加载任务详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && taskId) {
      loadTask();
    }
  }, [open, taskId]);

  // 处理接取任务
  const handleTakeTask = async () => {
    if (!task) return;
    confirm({
      title: '确认接取任务',
      icon: <ExclamationCircleOutlined />,
      content: '接取任务后，您需要在截止日期前完成任务。确定要接取这个任务？',
      okText: '确认接取',
      cancelText: '取消',
      async onOk() {
        try {
          await taskService.takeTask(task.id);
          message.success('任务接取成功');
          loadTask();
          onStatusChange?.();
        } catch (error) {
          message.error('任务接取失败');
        }
      },
    });
  };

  // 处理提交任务
  const handleSubmitTask = async (data: TaskSubmitData) => {
    if (!task) return;
    try {
      await taskService.submitTask(task.id, data);
      message.success('任务提交成功');
      setSubmitModalVisible(false);
      loadTask();
      onStatusChange?.();
    } catch (error) {
      message.error('任务提交失败');
    }
  };

  // 处理审核任务
  const handleReviewTask = async (status: 'completed' | 'rejected', review_note: string) => {
    if (!task) return;
    try {
      await taskService.reviewTask(task.id, status, review_note);
      message.success('审核完成');
      setReviewModalVisible(false);
      loadTask();
      onStatusChange?.();
    } catch (error: any) {
      console.error('审核失败:', error);
      message.error(error.response?.data?.detail || '审核失败');
    }
  };

  // 处理取消任务
  const handleCancelTask = async () => {
    if (!task) return;
    confirm({
      title: '确认取消任务',
      icon: <ExclamationCircleOutlined />,
      content: '取消任务后，其他用户将无法接取此任务。确定要取消这个任务吗？',
      okText: '确认取消',
      cancelText: '取消',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await taskService.cancelTask(task.id);
          message.success('任务已取消');
          loadTask();
          onStatusChange?.();
        } catch (error) {
          message.error('取消任务失败');
        }
      },
    });
  };

  // 处理放弃任务
  const handleAbandonTask = async () => {
    if (!task) return;
    confirm({
      title: '确认放弃任务',
      icon: <ExclamationCircleOutlined />,
      content: '放弃任务后，任务将重新变为待接取状态，其他人可以接取。确定要放弃这个任务吗？',
      okText: '确认放弃',
      cancelText: '取消',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await taskService.abandonTask(task.id);
          message.success('已放弃任务');
          loadTask();
          onStatusChange?.();
        } catch (error) {
          message.error('放弃任务失败');
        }
      },
    });
  };

  // 处理重新提交
  const handleRetryTask = async () => {
    if (!task) return;
    try {
      await taskService.retryTask(task.id);
      message.success('可以重新提交任务了');
      loadTask();
      setSubmitModalVisible(true);
      onStatusChange?.();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 处理联系委托人
  const handleContactCreator = async () => {
    if (!task || !task.creator.uid) {
      message.error('无法获取委托人信息');
      return;
    }
    
    try {
      const requestData = { recipient_uid: task.creator.uid };
      const response = await request.post('/chat/conversations/', requestData);
      
      if (!response.data.id) {
        message.error('创建对话失败：无效的响应数据');
        return;
      }
      
      const conversationId = response.data.id;
      setCurrentConversationId(conversationId);
      setChatModalVisible(true);

      try {
        await chatService.markAsRead(conversationId);
      } catch (error) {
        console.error('标记已读失败:', error);
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建对话失败');
    }
  };

  // 处理联系接取人
  const handleContactAssignee = async () => {
    if (!task?.assignee?.uid) {
      message.error('无法获取接取人信息');
      return;
    }
    
    try {
      const requestData = { recipient_uid: task.assignee.uid };
      const response = await request.post('/chat/conversations/', requestData);
      
      if (!response.data.id) {
        message.error('创建对话失败：无效的响应数据');
        return;
      }
      
      const conversationId = response.data.id;
      setCurrentConversationId(conversationId);
      setChatModalVisible(true);

      try {
        await chatService.markAsRead(conversationId);
      } catch (error) {
        console.error('标记已读失败:', error);
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建对话失败');
    }
  };

  const handleCloseModal = () => {
    setTask(null);
    setChatModalVisible(false);
    setCurrentConversationId(null);
    onClose();
  };

  const modalContent = (
    <div className="max-h-[70vh] overflow-y-auto">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : task ? (
        <Card bordered={false}>
          {/* 任务标题和状态 */}
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold">{task.title}</h1>
              <Tag color={getStatusColor(task.status)}>{getStatusText(task.status)}</Tag>
            </div>

            {/* 任务基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-500">
              <div className="flex items-center space-x-2">
                <Avatar 
                  icon={<UserOutlined />} 
                  src={getMediaUrl(task.creator.avatar)}
                />
                <span>委托人：{task.creator.username}</span>
                {!isCreator && task.creator.uid && (
                  <Button 
                    type="link" 
                    icon={<MessageOutlined />}
                    onClick={handleContactCreator}
                  >
                    联系委托人
                  </Button>
                )}
              </div>
              {task.assignee && (
                <div className="flex items-center space-x-2">
                  <Avatar 
                    icon={<UserOutlined />} 
                    src={getMediaUrl(task.assignee.avatar)}
                  />
                  <span>接取人：{task.assignee.username}</span>
                  {isCreator && task.assignee.uid && (
                    <Button 
                      type="link" 
                      icon={<MessageOutlined />}
                      onClick={handleContactAssignee}
                    >
                      联系接取人
                    </Button>
                  )}
                </div>
              )}
              <div>报酬：<span className="text-primary font-bold">¥{task.reward}</span></div>
              <div>截止日期：{formatDeadline(task.deadline)}</div>
            </div>
          </div>

          {/* 任务描述 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">任务描述</h2>
            <div className="whitespace-pre-wrap">{task.description}</div>
          </div>

          {/* 需要提交的材料 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">需要提交的材料</h2>
            <div className="whitespace-pre-wrap">{task.required_materials}</div>
          </div>

          {/* 完成说明（如果已提交或完成） */}
          {(task.status === 'submitted' || task.status === 'completed') && task.completion_note && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">完成说明</h2>
              <div className="whitespace-pre-wrap">{task.completion_note}</div>
              {task.attachments && (
                <div className="mt-4">
                  <h3 className="text-md font-bold mb-2">提交的附件</h3>
                  <a 
                    href={getMediaUrl(task.attachments)}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center text-blue-500 hover:text-blue-700"
                  >
                    <DownloadOutlined className="mr-1" />
                    下载附件
                  </a>
                </div>
              )}
            </div>
          )}

          {/* 审核说明（如果已完成或被拒绝） */}
          {(task.status === 'completed' || task.status === 'rejected') && task.review_note && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">审核说明</h2>
              <div className="whitespace-pre-wrap">{task.review_note}</div>
            </div>
          )}

          {/* 过期信息（如果已过期） */}
          {task.status === 'expired' && task.expired_at && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2">过期信息</h2>
              <div className="text-red-500">
                该任务已于 {new Date(task.expired_at).toLocaleString()} 过期
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-4">
            {task.status === 'pending' && !isCreator && !isAssignee && (
              <Button type="primary" onClick={handleTakeTask}>
                接取任务
              </Button>
            )}
            {isCreator && task.status === 'pending' && (
              <Button danger onClick={handleCancelTask}>
                取消任务
              </Button>
            )}
            {isAssignee && task.status === 'in_progress' && (
              <>
                <Button type="primary" onClick={() => setSubmitModalVisible(true)}>
                  提交任务
                </Button>
                <Button danger onClick={handleAbandonTask}>
                  放弃任务
                </Button>
              </>
            )}
            {isCreator && task.status === 'submitted' && (
              <Button type="primary" onClick={() => setReviewModalVisible(true)}>
                审核任务
              </Button>
            )}
            {isAssignee && task.status === 'rejected' && (
              <>
                <Button onClick={handleRetryTask} type="primary">
                  重新提交
                </Button>
                <Button danger onClick={handleAbandonTask}>
                  放弃任务
                </Button>
              </>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );

  return (
    <>
      <Modal
        title="任务详情"
        open={open}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
        destroyOnClose
        zIndex={1000}
      >
        {modalContent}
      </Modal>

      <TaskSubmitModal
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        onSubmit={handleSubmitTask}
        zIndex={1001}
      />

      <TaskReviewModal
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        onSubmit={handleReviewTask}
        zIndex={1001}
      />

      <ChatModal
        open={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        conversationId={currentConversationId}
        recipientName={task?.creator.username || '委托人'}
        zIndex={1001}
      />
    </>
  );
};

export default TaskDetailModal;