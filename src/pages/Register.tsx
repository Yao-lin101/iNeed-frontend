import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/auth';
import debounce from 'lodash/debounce';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  password2: string;
  verification_code: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [form] = Form.useForm();
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

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

  const checkUsername = debounce(async (username: string) => {
    if (!username || username.length < 3) {
      return;
    }

    try {
      setIsCheckingUsername(true);
      await authService.checkUsername(username);
      // 如果没有抛出错误，说明用户名可用
      form.setFields([{
        name: 'username',
        errors: [],
        validating: false,
      }]);
    } catch (error: any) {
      form.setFields([{
        name: 'username',
        errors: [error.response?.data?.detail || '检查用户名失败'],
        validating: false,
      }]);
    } finally {
      setIsCheckingUsername(false);
    }
  }, 500);

  const onFinish = async (values: RegisterFormData) => {
    try {
      await register(
        values.username,
        values.email,
        values.password,
        values.password2,
        values.verification_code,
      );
      message.success('注册成功');
      navigate('/');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '注册失败');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
      <Card title="注册" className="w-full max-w-[400px]">
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              {
                validator: async (_, value) => {
                  if (value && value.length >= 3) {
                    await checkUsername(value);
                  }
                }
              }
            ]}
            validateTrigger={['onBlur', 'onChange']}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

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

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password2"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full"
              size="large"
              loading={isLoading || isCheckingUsername}
            >
              注册
            </Button>
          </Form.Item>

          <div className="text-center">
            <span className="text-gray-600">已有账号？</span>
            <Link to="/login" className="ml-2 text-blue-600">
              立即登录
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register; 