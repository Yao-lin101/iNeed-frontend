import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, DatePicker, Select, Button } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { TextArea } = Input;

export interface TaskFormData {
  title: string;
  description: string;
  reward: number;
  deadline_date: Dayjs;
  deadline_hour: number;
  required_materials: string;
}

interface TaskFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<TaskFormData>;
  onSubmit: (values: TaskFormData) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  submitting
}) => {
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  // 当有初始值时，设置选中的日期
  useEffect(() => {
    if (initialValues?.deadline_date) {
      setSelectedDate(initialValues.deadline_date);
    }
  }, [initialValues]);

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

  // 当日期改变时更新小时选项
  const handleDateChange = (date: Dayjs | null) => {
    setSelectedDate(date);
    form.setFieldValue('deadline_hour', undefined);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={initialValues}
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
          { type: 'number', min: 0.01, message: '报酬必须大于0', transform: (value) => Number(value) }
        ]}
      >
        <InputNumber
          placeholder="请输入报酬金额"
          prefix="¥"
          min={0.01}
          precision={2}
        />
      </Form.Item>

      <Form.Item label="截止时间" required>
        <div className="flex items-center space-x-4">
          <Form.Item
            name="deadline_date"
            rules={[{ required: true, message: '请选择截止日期' }]}
            noStyle
          >
            <DatePicker
              format="YYYY-MM-DD"
              placeholder="选择日期"
              disabledDate={disabledDate}
              onChange={handleDateChange}
              defaultPickerValue={dayjs()}
              style={{ width: '160px' }}
            />
          </Form.Item>

          <Form.Item
            name="deadline_hour"
            rules={[{ required: true, message: '请选择截止时间' }]}
            dependencies={['deadline_date']}
            noStyle
          >
            <Select
              placeholder="选择时间"
              options={getHourOptions()}
              disabled={!selectedDate}
              style={{ width: '100px' }}
            />
          </Form.Item>
        </div>
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

      <Form.Item className="mb-0 mt-8">
        <div className="flex justify-end space-x-4">
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            {mode === 'create' ? '发布任务' : '保存修改'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default TaskForm; 