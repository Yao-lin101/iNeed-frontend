import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Upload, Avatar } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/auth';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';

interface ProfileFormData {
  username: string;
  email: string;
  phone?: string;
}

const Profile: React.FC = () => {
  const { user, loadUser } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState<UploadFile | null>(null);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
      });
      if (user.avatar) {
        setAvatar({
          uid: '-1',
          name: 'avatar',
          status: 'done',
          url: user.avatar,
        });
      }
    }
  }, [user, form]);

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片必须小于 2MB！');
      return false;
    }
    return true;
  };

  const onFinish = async (values: ProfileFormData) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      // 添加基本信息
      formData.append('username', values.username);
      formData.append('email', values.email);
      if (values.phone) {
        formData.append('phone', values.phone);
      }

      // 如果有新的头像文件，添加到 FormData
      if (avatar && 'originFileObj' in avatar && avatar.originFileObj) {
        formData.append('avatar', avatar.originFileObj);
      }

      // 发送请求
      await authService.updateProfile(formData);
      await loadUser(); // 重新加载用户信息以更新头像
      message.success('个人资料更新成功');
    } catch (error: any) {
      console.error('Update profile error:', error);
      message.error(error.response?.data?.detail || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card title="个人资料" className="shadow-md">
        <div className="flex justify-center mb-8">
          <Upload
            name="avatar"
            listType="picture-circle"
            className="avatar-uploader"
            showUploadList={false}
            beforeUpload={(file) => {
              const isValid = beforeUpload(file);
              if (isValid) {
                setAvatar({ 
                  uid: '-1',
                  name: file.name,
                  status: 'done',
                  url: URL.createObjectURL(file),
                  originFileObj: file 
                });
              }
              return false; // 阻止自动上传
            }}
            maxCount={1}
          >
            {avatar ? (
              <Avatar
                src={avatar.url}
                size={100}
                alt="avatar"
              />
            ) : (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传头像</div>
              </div>
            )}
          </Upload>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            username: user?.username,
            email: user?.email,
            phone: user?.phone,
          }}
        >
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
            name="phone"
            label="手机号码"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="手机号码（选填）"
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