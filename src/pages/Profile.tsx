import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, message, Upload, Avatar } from 'antd';
import { UserOutlined, MailOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/auth';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';

const { TextArea } = Input;

interface ProfileFormData {
  username: string;
  email: string;
  bio?: string;
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
        bio: user.bio,
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
      
      formData.append('username', values.username);
      formData.append('email', values.email);
      if (values.bio) {
        formData.append('bio', values.bio);
      }
      if (values.phone) {
        formData.append('phone', values.phone);
      }

      if (avatar && 'originFileObj' in avatar && avatar.originFileObj) {
        formData.append('avatar', avatar.originFileObj);
      }

      await authService.updateProfile(formData);
      await loadUser();
      message.success('个人资料更新成功');
    } catch (error: any) {
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
              return false;
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

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            username: user?.username,
            email: user?.email,
            bio: user?.bio,
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