import React, { useState } from 'react';
import { Modal, message } from 'antd';
import { taskService } from '@/services/taskService';
import TaskForm, { TaskFormData } from './TaskForm';

interface TaskFormModalProps {
  mode?: 'create' | 'edit';
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  taskId?: number;
  initialValues?: Partial<TaskFormData>;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  mode = 'create',
  open,
  onCancel,
  onSuccess,
  taskId,
  initialValues
}) => {
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = () => {
    onCancel();
  };

  const handleSubmit = async (values: TaskFormData) => {
    try {
      setSubmitting(true);
      // 合并日期和小时
      const deadline = values.deadline_date
        .hour(values.deadline_hour)
        .minute(0)
        .second(0);

      const taskData = {
        ...values,
        deadline: deadline.format('YYYY-MM-DD HH:mm:ss'),
        status: 'pending' as const,
      };

      if (mode === 'create') {
        await taskService.createTask(taskData);
        message.success('任务发布成功');
      } else {
        if (!taskId) throw new Error('Missing taskId for edit mode');
        await taskService.updateTask(taskId, taskData);
        message.success('任务更新成功');
      }

      handleCancel();
      onSuccess?.();
    } catch (error: any) {
      const action = mode === 'create' ? '发布' : '更新';
      message.error(error.response?.data?.detail || `${action}任务失败`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={mode === 'create' ? '发布任务' : '编辑任务'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnClose
      maskClosable={false}
    >
      <TaskForm
        mode={mode}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={submitting}
      />
    </Modal>
  );
};

export default TaskFormModal; 