import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/auth';
import AvatarUpload from '@/components/AvatarUpload';
import { getMediaUrl } from '@/utils/url';

const { TextArea } = Input;

interface ProfileFormData {
  username: string;
  email: string;
  bio?: string;
  phone?: string;
  avatar?: File | string;
}

const Profile: React.FC = () => {
  const { user, loadUser } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        bio: user.bio,
        phone: user.phone,
        avatar: user.avatar ? getMediaUrl(user.avatar) : undefined
      });
    }
  }, [user, form]);

  const onFinish = async (values: ProfileFormData) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      // 处理头像文件
      if (values.avatar && values.avatar instanceof File) {
        formData.append('avatar', values.avatar);
      }
      
      // 添加其他字段
      formData.append('username', values.username);
      formData.append('email', values.email);
      if (values.bio) {
        formData.append('bio', values.bio);
      }
      if (values.phone) {
        formData.append('phone', values.phone);
      }

      await authService.updateProfile(formData);
      await loadUser();
      message.success('个人资料更新成功');
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errors = error.response.data;
        // 处理字段级别的错误
        if (typeof errors === 'object') {
          Object.keys(errors).forEach(key => {
            const errorMessages = Array.isArray(errors[key]) ? errors[key] : [errors[key]];
            form.setFields([{
              name: key,
              errors: errorMessages
            }]);
          });
        } else {
          // 处理非字段级别的错误
          message.error(error.response.data.detail || '更新失败');
        }
      } else {
        message.error(error.response?.data?.detail || '更新失败');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card title="个人资料" className="shadow-md">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <div className="flex justify-center mb-8">
            <Form.Item
              name="avatar"
              valuePropName="value"
              getValueFromEvent={(e) => {
                if (e?.file instanceof File) {
                  return e.file;
                }
                return e;
              }}
            >
              <AvatarUpload />
            </Form.Item>
          </div>

          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-1">用户ID (UID)</div>
            <Input
              value={user?.uid ?? '加载中...'}
              disabled
              style={{ 
                backgroundColor: '#f5f5f5', 
                cursor: 'default',
                color: user?.uid ? '#000' : '#999'
              }}
              readOnly
            />
          </div>

          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱"
              disabled
            />
          </Form.Item>

          <Form.Item
            name="bio"
            label="个人简介"
            rules={[
              { max: 500, message: '简介最多500个字符' }
            ]}
          >
            <TextArea
              placeholder="介绍一下你自己吧..."
              autoSize={{ minRows: 3, maxRows: 6 }}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Profile; 