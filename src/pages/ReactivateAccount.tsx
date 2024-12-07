import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/auth';

interface ReactivateFormData {
  email: string;
  verification_code: string;
}

const ReactivateAccount: React.FC = () => {
  const navigate = useNavigate();
  const { loadUser } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendVerificationCode = async () => {
    try {
      const email = form.getFieldValue('email');
      if (!email) {
        message.error('请输入邮箱地址');
        return;
      }

      setIsSendingCode(true);
      await authService.sendVerificationCode(email);
      message.success('验证码已发送');
      startCountdown();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '发送验证码失败');
    } finally {
      setIsSendingCode(false);
    }
  };

  const onFinish = async (values: ReactivateFormData) => {
    try {
      setLoading(true);
      const response = await authService.reactivateAccount(
        values.email,
        values.verification_code
      );
      
      // 保存登录信息
      localStorage.setItem('token', response.token);
      localStorage.setItem('uid', response.uid);
      
      // 加载用户信息
      await loadUser();
      
      message.success('账号已重新激活');
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '重新激活失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <Card title="重新激活账号" className="w-full max-w-[400px]">
        <Form
          form={form}
          name="reactivate"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="verification_code"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="验证码"
                size="large"
              />
              <Button
                size="large"
                onClick={handleSendVerificationCode}
                disabled={countdown > 0 || isSendingCode}
                loading={isSendingCode}
              >
                {countdown > 0 ? `${countdown}秒后重试` : '发送验证码'}
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full"
              size="large"
              loading={loading}
            >
              重新激活
            </Button>
          </Form.Item>

          <div className="text-center text-sm text-gray-500">
            重新激活账号后，您的历史任务关联将被恢复
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ReactivateAccount; 