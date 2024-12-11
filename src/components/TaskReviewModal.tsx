import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Radio, message } from 'antd';

const { TextArea } = Input;

interface TaskReviewModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (status: 'completed' | 'rejected', review_note: string) => Promise<void>;
  zIndex?: number;
}

const TaskReviewModal: React.FC<TaskReviewModalProps> = ({
  open,
  onCancel,
  onSubmit,
  zIndex
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'completed' | 'rejected'>('completed');

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setStatus('completed');
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onSubmit(values.status, values.review_note || '');
      form.resetFields();
      onCancel();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '审核失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="审核任务"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="确认"
      cancelText="取消"
      confirmLoading={submitting}
      zIndex={zIndex}
    >
      <Form 
        form={form} 
        layout="vertical"
        initialValues={{ status: 'completed' }}
      >
        <Form.Item
          name="status"
          label="审核结果"
          rules={[{ required: true, message: '请选择审核结果' }]}
        >
          <Radio.Group onChange={(e) => setStatus(e.target.value)}>
            <Radio value="completed">通过</Radio>
            <Radio value="rejected">驳回</Radio>
          </Radio.Group>
        </Form.Item>

        {status === 'rejected' && (
          <Form.Item
            name="review_note"
            label="驳回说明"
            rules={[{ required: true, message: '请输入驳回说明' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入驳回说明"
              maxLength={500}
              showCount
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default TaskReviewModal; 