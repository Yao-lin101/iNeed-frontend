import React, { useState } from 'react';
import { Card, Button, Modal, message, Alert, List } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { deleteAccount, cancelPendingTasks, checkAccountStatus } from '../services/userService';
import ThankYouModal from '../components/ThankYouModal';

interface TaskStatus {
  has_active_tasks: boolean;
  created_active_tasks: number;
  assigned_active_tasks: number;
  total_created_tasks: number;
  total_assigned_tasks: number;
  created_tasks_by_status: {
    pending: number;
    in_progress: number;
    submitted: number;
  };
  assigned_tasks_by_status: {
    in_progress: number;
    submitted: number;
  };
}

const AccountSettings: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [taskError, setTaskError] = useState<{
    detail: string;
    reason: string;
    active_tasks: string[];
    task_status: TaskStatus;
  } | null>(null);

  const showDeleteConfirm = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setTaskError(null);
  };

  const handleCancelPendingTasks = async () => {
    try {
      setIsCancelling(true);
      const result = await cancelPendingTasks();
      message.success(`已取消 ${result.task_results?.cancelled_tasks} 个待接取的任务`);
      
      // 重新检查任务状态
      try {
        await checkAccountStatus();
        // 如果检查成功，说明没有活跃任务了
        setTaskError(null);
      } catch (error: any) {
        if (error.response?.data?.active_tasks) {
          // 更新剩余的活跃任务状态
          setTaskError(error.response.data);
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.detail || '取消任务失败');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      setIsModalVisible(false);
      setShowThankYou(true);
    } catch (error: any) {
      if (error.response?.data?.active_tasks) {
        setTaskError(error.response.data);
      } else {
        message.error(error.response?.data?.detail || '删除账号失败');
      }
      setIsDeleting(false);
    }
  };

  const handleThankYouClose = () => {
    setShowThankYou(false);
    logout();
    navigate('/login');
  };

  const renderTaskList = () => {
    if (!taskError) return null;

    const hasPendingTasks = taskError.task_status.created_tasks_by_status.pending > 0;

    return (
      <div className="space-y-4">
        <Alert
          message={taskError.detail}
          description={taskError.reason}
          type="error"
          showIcon
        />
        <List
          header={
            <div className="flex justify-between items-center">
              <div className="font-medium">活跃任务列表：</div>
              {hasPendingTasks && (
                <Button
                  type="primary"
                  danger
                  size="small"
                  onClick={handleCancelPendingTasks}
                  loading={isCancelling}
                >
                  一键取消待接取任务
                </Button>
              )}
            </div>
          }
          bordered
          dataSource={taskError.active_tasks}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
        <div className="text-sm text-gray-500 mt-4">
          {hasPendingTasks ? (
            <p>您可以使用"一键取消待接取任务"功能来取消所有待接取的任务。其他状态的任务需要单独处理。</p>
          ) : (
            <p>请先处理这些任务后再尝试删除账号。</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <Card title="账号设置" className="max-w-2xl mx-auto">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-red-600 mb-2">危险操作</h3>
            <Button
              danger
              onClick={showDeleteConfirm}
              className="w-full md:w-auto"
            >
              删除账号
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        title={<span className="text-red-600">删除账号确认</span>}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button
            key="delete"
            danger
            type="primary"
            loading={isDeleting}
            onClick={handleDeleteAccount}
            disabled={!!taskError}
          >
            确认删除
          </Button>,
        ]}
        width={600}
      >
        {taskError ? (
          renderTaskList()
        ) : (
          <div className="space-y-4">
            <ExclamationCircleOutlined className="text-2xl text-yellow-500" />
            <p>您确定要删除账号吗？此操作不可逆转，所有数据将被永久删除。</p>
            <Alert
              message="请注意"
              description="删除账号前，请确保：
              1. 您已完成所有进行中的任务
              2. 您已处理所有待审核的任务
              3. 您已取消所有待接取的任务"
              type="warning"
              showIcon
            />
          </div>
        )}
      </Modal>

      <ThankYouModal open={showThankYou} onClose={handleThankYouClose} />
    </div>
  );
};

export default AccountSettings; 