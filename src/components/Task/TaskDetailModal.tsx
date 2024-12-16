import React, { useState, useMemo } from 'react';
import { Modal, Button, message, Spin, Avatar } from 'antd';
import { 
  DownloadOutlined, 
  ExclamationCircleOutlined, 
  UserOutlined,
  MessageOutlined,
  CloseOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/store/useAuthStore';
import { taskService, TaskSubmitData } from '@/services/taskService';
import { chatService } from '@/services/chatService';
import { useTaskStore } from '@/models/TaskModel';
import TaskSubmitModal from './TaskSubmitModal';
import TaskReviewModal from './TaskReviewModal';
import ChatModal from '@/components/Chat/ChatModal';
import { getMediaUrl } from '@/utils/url';
import { formatDeadline } from '@/utils/date';
import classNames from 'classnames';
import TaskForm, { TaskFormData } from './TaskForm';
import dayjs from 'dayjs';
import { systemMessageService } from '@/services/systemMessageService';


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
    detailLoading: loading,
    modalVisible: open,
    resetState,
    loadTaskDetail,
    loadTasks,
    modalContext,
    currentPage,
    loadMyTasks
  } = useTaskStore();

  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
          
          // 发送系统通知给委托人
          await systemMessageService.sendNotification({
            recipient_uid: task.creator.uid,
            type: 'task_taken',
            title: '任务被接取通知',
            content: `您的任务"${task.title}"已被用户 ${user?.username} 接取`,
            metadata: {
              task_id: task.id,
              task_title: task.title,
              assignee_uid: user?.uid,
              assignee_username: user?.username
            }
          });

          message.success('任务接取成功');
          await loadTaskDetail(task.id);
          await refreshTaskList();
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
      
      // 发送系统通知给委托人
      await systemMessageService.sendNotification({
        recipient_uid: task.creator.uid,
        type: 'task_submitted',
        title: '任务待审核通知',
        content: `您的任务"${task.title}"已被接取人 ${user?.username} 提交，请及时审核`,
        metadata: {
          task_id: task.id,
          task_title: task.title,
          assignee_uid: user?.uid,
          assignee_username: user?.username,
          completion_note: data.completion_note,
          has_attachments: !!data.attachments
        }
      });

      message.success('任务提交成功');
      setSubmitModalVisible(false);
      await loadTaskDetail(task.id);
      await refreshTaskList();
    } catch (error) {
      message.error('任务提交失败');
    }
  };

  // 处理审核任务
  const handleReviewTask = async (status: 'completed' | 'rejected', review_note: string) => {
    if (!task) return;
    try {
      await taskService.reviewTask(task.id, status, review_note);
      
      // 发送系统通知给接取人
      await systemMessageService.sendNotification({
        recipient_uid: task.assignee!.uid,
        type: status === 'completed' ? 'task_completed' : 'task_rejected',
        title: status === 'completed' ? '任务审核通过通知' : '任务审核未通过通知',
        content: status === 'completed' 
          ? `您提交的任务"${task.title}"已通过审核，任务已完成` 
          : `您提交的任务"${task.title}"未通过审核，请查看审核说明`,
        metadata: {
          task_id: task.id,
          task_title: task.title,
          review_status: status,
          review_note: review_note,
          creator_uid: user?.uid,
          creator_username: user?.username
        }
      });

      message.success('审核完成');
      setReviewModalVisible(false);
      await loadTaskDetail(task.id);
      await refreshTaskList();
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
          await refreshTaskList();
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                             error.response?.data?.error || 
                             '取消任务失败';
          message.error(errorMessage);
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
          
          // 发送系统通知给委托人
          await systemMessageService.sendNotification({
            recipient_uid: task.creator.uid,
            type: 'task_abandoned',
            title: '任务被放弃通知',
            content: `您的任务"${task.title}"已被接取人 ${user?.username} 放弃`,
            metadata: {
              task_id: task.id,
              task_title: task.title,
              assignee_uid: user?.uid,
              assignee_username: user?.username
            }
          });

          message.success('已放弃任务');
          await loadTaskDetail(task.id);
          await refreshTaskList();
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
      await refreshTaskList();
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
      const response = await chatService.createConversation(task.creator.uid);
      const conversationId = response.data.id;
      setCurrentConversationId(conversationId);
      setChatModalVisible(true);
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
      const response = await chatService.createConversation(task.assignee.uid);
      const conversationId = response.data.id;
      setCurrentConversationId(conversationId);
      setChatModalVisible(true);
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建对话失败');
    }
  };

  // 准备编辑初始值
  const getInitialValues = () => {
    if (!task) return undefined;
    
    const deadline = dayjs(task.deadline);
    return {
      title: task.title,
      description: task.description,
      required_materials: task.required_materials,
      reward: Number(task.reward),
      deadline_date: deadline,
      deadline_hour: deadline.hour()
    };
  };

  // 处理编辑提交
  const handleEditSubmit = async (values: TaskFormData) => {
    if (!task) return;
    try {
      setSubmitting(true);
      const deadline = values.deadline_date
        .hour(values.deadline_hour)
        .minute(0)
        .second(0);

      const taskData = {
        ...values,
        deadline: deadline.format('YYYY-MM-DD HH:mm:ss'),
        status: 'pending' as const,
      };

      await taskService.updateTask(task.id, taskData);
      message.success('任务更新成功');
      setIsEditing(false);
      await loadTaskDetail(task.id);
      await refreshTaskList();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error || 
                          '更新任务失败';
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsEditing(false);
    resetState();
  };

  const refreshTaskList = async () => {
    switch (modalContext) {
      case 'myTasks':
        await loadMyTasks(currentPage);
        break;
      case 'taskCenter':
        await loadTasks(currentPage);
        break;
      // notification 或其他情况下不刷新列表
    }
  };

  return (
    <>
      <Modal
        title={null}
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
            height: '80vh',
            maxHeight: '800px',
            background: '#fff',
            borderRadius: '16px'
          },
          body: {
            padding: 0,
            height: '100%',
            overflow: 'hidden'
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
          <div className="flex justify-center items-center h-full">
            <Spin size="large" />
          </div>
        ) : task ? (
          <div className="h-full flex flex-col">
            <div className="relative h-full">
              {/* 编辑模式 */}
              <div className={classNames(
                'absolute w-full h-full transition-all duration-300 transform',
                isEditing 
                  ? 'opacity-100 translate-x-0 z-10' 
                  : 'opacity-0 translate-x-full pointer-events-none'
              )}>
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto p-6">
                    <TaskForm
                      mode="edit"
                      initialValues={getInitialValues()}
                      onSubmit={handleEditSubmit}
                      onCancel={() => setIsEditing(false)}
                      submitting={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* 详情模式 */}
              <div className={classNames(
                'absolute w-full h-full transition-all duration-300 transform',
                isEditing 
                  ? 'opacity-0 -translate-x-full pointer-events-none' 
                  : 'opacity-100 translate-x-0 z-10'
              )}>
                <div className="h-full flex flex-col">
                  <div className="flex-none p-6">
                    <div className="relative flex flex-col items-center mb-6">
                      <h1 className="text-2xl font-bold text-gray-600 mb-2">{task.title}</h1>
                      <span className={classNames(
                        'task-tag',
                        getStatusClassName(task.status),
                        rewardLevel === 5 && 'gradient-bg border border-white/30'
                      )}>
                        {rewardLevel === 5 ? (
                          <span className="gradient-text font-medium">
                            {getStatusText(task.status)}
                          </span>
                        ) : (
                          <span>{getStatusText(task.status)}</span>
                        )}
                      </span>
                    </div>

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
                        {rewardLevel === 5 ? (
                          <span className="font-bold gradient-text">
                            ¥{task.reward}
                          </span>
                        ) : (
                          <span className={`font-bold reward-text-${rewardLevel}`}>
                            ¥{task.reward}
                          </span>
                        )}
                      </div>
                      <div>截止日期：{formatDeadline(task.deadline)}</div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto px-6">
                    <div className="py-4">
                      <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-600 mb-2">任务描述</h2>
                        <div className="whitespace-pre-wrap">{task.description}</div>
                      </div>

                      <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-600 mb-2">需要提交的材料</h2>
                        <div className="whitespace-pre-wrap">{task.required_materials}</div>
                      </div>

                      {(task.status === 'submitted' || task.status === 'completed') && task.completion_note && (
                        <div className="mb-6">
                          <h2 className="text-lg font-bold text-gray-600 mb-2">完成说明</h2>
                          <div className="whitespace-pre-wrap">{task.completion_note}</div>
                          {task.attachments && (
                            <div className="mt-4">
                              <h3 className="text-md font-bold text-gray-600 mb-2">提交的附件</h3>
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

                      {(task.status === 'completed' || task.status === 'rejected') && task.review_note && (
                        <div className="mb-6">
                          <h2 className="text-lg font-bold text-gray-600 mb-2">审核说明</h2>
                          <div className="whitespace-pre-wrap">{task.review_note}</div>
                        </div>
                      )}

                      {task.status === 'expired' && task.expired_at && (
                        <div className="mb-6">
                          <h2 className="text-lg font-bold text-gray-600 mb-2">过期信息</h2>
                          <div className="text-red-500">
                            该任务已于 {new Date(task.expired_at).toLocaleString()} 过期
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-none border-t bg-white">
                    <div className="px-6 py-4 flex justify-end gap-4">
                      {task.status === 'pending' && !isCreator && !isAssignee && (
                        <Button type="primary" onClick={handleTakeTask}>
                          接取任务
                        </Button>
                      )}
                      {isCreator && task.status === 'pending' && (
                        <>
                          <Button
                            type="default"
                            onClick={() => setIsEditing(true)}
                            icon={<EditOutlined />}
                          >
                            编辑
                          </Button>
                          <Button danger onClick={handleCancelTask}>
                            取消任务
                          </Button>
                        </>
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
                </div>
              </div>
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