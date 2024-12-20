import React, { useState } from 'react';
import { Modal, Form, Input, Upload, message, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
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
      
      // 在提交前验证文件大小
      if (fileList[0]?.originFileObj && fileList[0].originFileObj.size > 5 * 1024 * 1024) {
        message.error('文件必须小于 5MB，较大文件请使用网盘或其他工具');
        return;
      }
      
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

  const beforeUpload = (file: RcFile) => {
    // 检查文件大小（5MB）
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('文件必须小于 5MB，较大文件请使用网盘或其他工具');
      return false;
    }
    return false; // 仍然阻止自动上传
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
          extra="文件大小不超过 5MB，较大文件请使用网盘或其他工具"
        >
          <Upload
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={beforeUpload}
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