import React, { useState } from 'react';
import { Form, Input, InputNumber, DatePicker, Select, Button, Modal, message } from 'antd';
import { taskService } from '../../services/taskService';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { TextArea } = Input;

interface TaskFormData {
  title: string;
  description: string;
  reward: number;
  deadline_date: Dayjs;
  deadline_hour: number;
  required_materials: string;
}

interface TaskFormModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({
  open,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const disabledDate = (current: Dayjs) => {
    // 不能选择今天之前的日期
    return current && current.startOf('day').valueOf() < dayjs().startOf('day').valueOf();
  };

  const getHourOptions = () => {
    const options = [];
    const now = dayjs();
    const isToday = selectedDate && selectedDate.format('YYYY-MM-DD') === now.format('YYYY-MM-DD');
    const startHour = isToday ? now.hour() + 1 : 0;

    for (let i = startHour; i <= 23; i++) {
      options.push({
        value: i,
        label: `${i}:00`
      });
    }
    return options;
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedDate(null);
    onCancel();
  };

  const onFinish = async (values: TaskFormData) => {
    try {
      setSubmitting(true);
      // 合并日期和小时
      const deadline = values.deadline_date
        .hour(values.deadline_hour)
        .minute(0)
        .second(0);

      await taskService.createTask({
        ...values,
        deadline: deadline.format('YYYY-MM-DD HH:mm:ss'),
        status: 'pending',
      });
      message.success('任务发布成功');
      handleCancel();
      onSuccess?.();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '发布任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 当日期改变时更新小时选项
  const handleDateChange = (date: Dayjs | null) => {
    setSelectedDate(date);
    form.setFieldValue('deadline_hour', undefined);
  };

  return (
    <Modal
      title="发布任务"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnClose
      maskClosable={false}
    >
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

        <div className="flex space-x-4">
          <Form.Item
            label="截止日期"
            name="deadline_date"
            rules={[{ required: true, message: '请选择截止日期' }]}
            style={{ width: '200px' }}
          >
            <DatePicker
              format="YYYY-MM-DD"
              placeholder="选择日期"
              disabledDate={disabledDate}
              onChange={handleDateChange}
              defaultPickerValue={dayjs()}
            />
          </Form.Item>

          <Form.Item
            label="截止时间"
            name="deadline_hour"
            rules={[{ required: true, message: '请选择截止时间' }]}
            style={{ width: '120px' }}
            dependencies={['deadline_date']}
          >
            <Select
              placeholder="选择时间"
              options={getHourOptions()}
              disabled={!selectedDate}
            />
          </Form.Item>
        </div>

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
            <Button onClick={handleCancel}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              发布任务
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TaskFormModal; 