import React, { useState } from 'react';
import { Modal, Form, Input, Upload, message, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { TaskSubmitData } from '../../services/taskService';

const { TextArea } = Input;

interface TaskSubmitModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (data: TaskSubmitData) => Promise<void>;
  zIndex?: number;
}

const TaskSubmitModal: React.FC<TaskSubmitModalProps> = ({
  open,
  onCancel,
  onSubmit,
  zIndex
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await onSubmit({
        completion_note: values.completion_note,
        attachments: fileList[0]?.originFileObj,
      });
      form.resetFields();
      setFileList([]);
      onCancel();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="提交任务"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="提交"
      cancelText="取消"
      confirmLoading={submitting}
      zIndex={zIndex}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="completion_note"
          label="完成说明"
          rules={[{ required: true, message: '请输入完成说明' }]}
        >
          <TextArea
            rows={4}
            placeholder="请详细说明任务完成情况"
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="attachments"
          label="相关材料"
        >
          <Upload
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={() => false}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TaskSubmitModal; 