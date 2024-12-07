import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, message, Spin, Empty, Modal, Tag, Avatar } from 'antd';
import { DownloadOutlined, ExclamationCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import { taskService, Task, TaskSubmitData } from '../services/taskService';
import TaskSubmitModal from '../components/TaskSubmitModal';
import TaskReviewModal from '../components/TaskReviewModal';
import { getMediaUrl } from '../utils/url';

const { confirm } = Modal;

const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  // 获取当前用户是否是任务创建者或接取者
  const isCreator = task?.creator.uid === user?.uid;
  const isAssignee = task?.assignee?.uid === user?.uid;

  // 获状态标签的颜色
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'default',
      in_progress: 'processing',
      submitted: 'warning',
      completed: 'success',
      rejected: 'error',
      cancelled: 'error'
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
      cancelled: '已取消'
    };
    return textMap[status] || status;
  };

  // 加载任务详情
  const loadTask = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTask(Number(taskId));
      setTask(data);
    } catch (error) {
      message.error('加载任务详情失败');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  // 处理接取任务
  const handleTakeTask = async () => {
    if (!task) return;
    confirm({
      title: '确认接取任务',
      icon: <ExclamationCircleOutlined />,
      content: '接取任务后，您需要在截止日期前完成任务。确定要接取这个任务吗？',
      okText: '确认接取',
      cancelText: '取消',
      async onOk() {
        try {
          await taskService.takeTask(task.id);
          message.success('任务接取成功');
          loadTask();
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
    } catch (error) {
      message.error('操作失败');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!task) {
    return <Empty description="任务不存在" />;
  }

  return (
    <div className="p-6">
      <Card>
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <Tag color={getStatusColor(task.status)}>{getStatusText(task.status)}</Tag>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-500">
            <div className="flex items-center space-x-2">
              <Avatar 
                icon={<UserOutlined />} 
                src={getMediaUrl(task.creator.avatar)}
              />
              <span>委托人：{task.creator.uid ? task.creator.username : '已删除用户'}</span>
            </div>
            {task.assignee && (
              <div className="flex items-center space-x-2">
                <Avatar 
                  icon={<UserOutlined />} 
                  src={getMediaUrl(task.assignee.avatar)}
                />
                <span>接取人：{task.assignee.uid ? task.assignee.username : '已删除用户'}</span>
              </div>
            )}
            <div>报酬：<span className="text-primary font-bold">¥{task.reward}</span></div>
            <div>截止日期：{task.deadline}</div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">任务描述</h2>
          <div className="whitespace-pre-wrap">{task.description}</div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">需要提交的材料</h2>
          <div className="whitespace-pre-wrap">{task.required_materials}</div>
        </div>

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
                  onClick={(e) => {
                    if (!task.attachments) {
                      e.preventDefault();
                      message.error('附件链接无效');
                    }
                  }}
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
            <h2 className="text-lg font-bold mb-2">审核说明</h2>
            <div className="whitespace-pre-wrap">{task.review_note}</div>
          </div>
        )}

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

      <TaskSubmitModal
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        onSubmit={handleSubmitTask}
      />

      <TaskReviewModal
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        onSubmit={handleReviewTask}
      />
    </div>
  );
};

export default TaskDetail; 