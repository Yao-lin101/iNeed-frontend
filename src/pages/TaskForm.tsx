import React from 'react';
import { Form, Input, InputNumber, DatePicker, Button, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';

const { TextArea } = Input;

interface TaskFormData {
  title: string;
  description: string;
  reward: number;
  deadline: Date;
  required_materials: string;
}

const TaskForm: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: TaskFormData) => {
    try {
      await taskService.createTask({
        ...values,
        deadline: values.deadline.toISOString(),
        status: 'pending', // 设置为待接取状态
      });
      message.success('任务发布成功');
      navigate('/tasks'); // 返回任务列表
    } catch (error: any) {
      message.error(error.response?.data?.detail || '发布任务失败');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card title="发布任务" className="shadow-md">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark
        >
          <Form.Item
            label="任务标题"
            name="title"
            rules={[
              { required: true, message: '请输入任务标题' },
              { max: 200, message: '标题不能超过200个字符' }
            ]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>

          <Form.Item
            label="任务描述"
            name="description"
            rules={[
              { required: true, message: '请输入任务描述' },
              { min: 10, message: '描述不能少于10个字符' }
            ]}
          >
            <TextArea
              placeholder="请详细描述任务要求"
              rows={6}
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            label="任务报酬"
            name="reward"
            rules={[
              { required: true, message: '请设置任务报酬' },
              { type: 'number', min: 0.01, message: '报酬必须大于0' }
            ]}
          >
            <InputNumber
              placeholder="请输入报酬金额"
              prefix="¥"
              min={0.01}
              precision={2}
              style={{ width: '200px' }}
            />
          </Form.Item>

          <Form.Item
            label="截止日期"
            name="deadline"
            rules={[{ required: true, message: '请选择截止日期' }]}
          >
            <DatePicker
              showTime
              placeholder="选择截止日期和时间"
              style={{ width: '200px' }}
              disabledDate={(current) => {
                // 不能选择过去的日期
                return current && current.valueOf() < Date.now();
              }}
            />
          </Form.Item>

          <Form.Item
            label="需要提交的材料"
            name="required_materials"
            rules={[{ required: true, message: '请说明需要提交的材料' }]}
          >
            <TextArea
              placeholder="请说明任务完成需要提交的材料，如文档、图片等"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end space-x-4">
              <Button onClick={() => navigate('/tasks')}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                发布任务
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TaskForm; 