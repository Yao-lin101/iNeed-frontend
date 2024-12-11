import React, { useState, useMemo } from 'react';
import { Modal, Card, Button, message, Spin, Tag, Avatar } from 'antd';
import { 
  DownloadOutlined, 
  ExclamationCircleOutlined, 
  UserOutlined,
  MessageOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/store/useAuthStore';
import { taskService, TaskSubmitData } from '@/services/taskService';
import { chatService } from '@/services/chatService';
import { request } from '@/utils/request';
import { useTaskStore } from '@/models/TaskModel';
import TaskSubmitModal from '../TaskSubmitModal';
import TaskReviewModal from '../TaskReviewModal';
import ChatModal from '@/components/Chat/ChatModal';
import { getMediaUrl } from '@/utils/url';
import { formatDeadline } from '@/utils/date';
import classNames from 'classnames';

const { confirm } = Modal;

// 获取报酬等级
const getRewardLevel = (reward: number) => {
  if (reward < 100) return 1;
  if (reward < 500) return 2;
  if (reward < 1000) return 3;
  if (reward < 5000) return 4;
  return 5;
};

// 获取状态的类名
const getStatusClassName = (status: string) => {
  return status.replace('_', '-');
};

const TaskDetailModal: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    selectedTask: task,
    selectedTaskId,
    detailLoading: loading,
    modalVisible: open,
    setModalVisible,
    resetState,
    loadTaskDetail,
    loadTasks
  } = useTaskStore();

  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);

  const isCreator = task?.creator.uid === user?.uid;
  const isAssignee = task?.assignee?.uid === user?.uid;

  // 计算报酬等级
  const rewardLevel = useMemo(() => task ? getRewardLevel(task.reward) : 1, [task?.reward]);

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
          await loadTaskDetail(task.id);
          await loadTasks();
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
      await loadTaskDetail(task.id);
      await loadTasks();
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
      await loadTaskDetail(task.id);
      await loadTasks();
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
          await loadTaskDetail(task.id);
          await loadTasks();
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
          await loadTaskDetail(task.id);
          await loadTasks();
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
      await loadTaskDetail(task.id);
      setSubmitModalVisible(true);
      await loadTasks();
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
    resetState();
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={handleCloseModal}
        footer={null}
        width={800}
        destroyOnClose
        zIndex={1000}
        className="task-detail-modal"
        closeIcon={<CloseOutlined className="text-lg" />}
        styles={{
          content: {
            padding: 0,
            overflow: 'hidden',
            maxHeight: '85vh',
            background: '#fff',
            borderRadius: '16px'
          },
          body: {
            padding: 0,
            maxHeight: '85vh',
            overflow: 'auto'
          },
          mask: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.45)'
          }
        }}
        modalRender={modal => (
          <div style={{ borderRadius: '16px', overflow: 'hidden' }}>
            {modal}
          </div>
        )}
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : task ? (
          <div className="px-6">
            {/* 任务标题和状态 */}
            <div className="relative flex flex-col items-center pt-6 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              <span className={classNames(
                'task-tag',
                'absolute right-4 top-6',
                getStatusClassName(task.status),
                `reward-level-${rewardLevel}`
              )}>
                <span className={`reward-text-${rewardLevel}`}>{getStatusText(task.status)}</span>
              </span>
            </div>

            {/* 任务基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-500 mb-6">
              <div className="flex items-center gap-2">
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
                    className="contact-btn"
                  >
                    联系委托人
                  </Button>
                )}
              </div>
              {task.assignee && (
                <div className="flex items-center gap-2">
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
                      className="contact-btn"
                    >
                      联系接取人
                    </Button>
                  )}
                </div>
              )}
              <div>
                报酬：
                <span className={`font-bold reward-text-${rewardLevel}`}>
                  ¥{task.reward}
                </span>
              </div>
              <div>截止日期：{formatDeadline(task.deadline)}</div>
            </div>

            {/* 任务描述 */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">任务描述</h2>
              <div className="whitespace-pre-wrap">{task.description}</div>
            </div>

            {/* 需要提交的材料 */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">需要提交的材料</h2>
              <div className="whitespace-pre-wrap">{task.required_materials}</div>
            </div>

            {/* 完成说明（如果已提交或完成） */}
            {(task.status === 'submitted' || task.status === 'completed') && task.completion_note && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">完成说明</h2>
                <div className="whitespace-pre-wrap">{task.completion_note}</div>
                {task.attachments && (
                  <div className="mt-4">
                    <h3 className="text-md font-bold text-gray-900 mb-2">提交的附件</h3>
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
                <h2 className="text-lg font-bold text-gray-900 mb-2">审核说明</h2>
                <div className="whitespace-pre-wrap">{task.review_note}</div>
              </div>
            )}

            {/* 过期信息（如果已过期） */}
            {task.status === 'expired' && task.expired_at && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">过期信息</h2>
                <div className="text-red-500">
                  该任务已于 {new Date(task.expired_at).toLocaleString()} 过期
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end gap-4 pb-6">
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
          </div>
        ) : null}
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