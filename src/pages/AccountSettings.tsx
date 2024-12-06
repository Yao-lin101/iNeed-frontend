import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, List, Button, Alert, Modal } from 'antd';
import {
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import { deleteAccount } from '../services/userService';

const AccountSettings: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [error, setError] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      await logout();
      navigate('/login');
    } catch (err: any) {
      setError(err.detail || '删除账号失败');
      setShowDeleteDialog(false);
    }
  };

  const settingsItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      title: '个人资料',
      description: '修改您的个人信息和头像',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      title: '删除账号',
      description: '永久删除您的账号和所有数据',
      onClick: () => setShowDeleteDialog(true),
      danger: true,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <Typography.Title level={2} className="mb-6">
          账号管理
        </Typography.Title>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            className="mb-4"
            closable
            onClose={() => setError('')}
          />
        )}

        <List
          itemLayout="horizontal"
          dataSource={settingsItems}
          renderItem={(item) => (
            <List.Item
              className={`cursor-pointer hover:bg-gray-50 rounded-lg ${
                item.danger ? 'hover:bg-red-50' : ''
              }`}
              onClick={item.onClick}
            >
              <List.Item.Meta
                avatar={
                  <span className={item.danger ? 'text-red-500' : ''}>
                    {item.icon}
                  </span>
                }
                title={
                  <span className={item.danger ? 'text-red-500' : ''}>
                    {item.title}
                  </span>
                }
                description={item.description}
              />
            </List.Item>
          )}
        />

        <Modal
          title="确认删除账号"
          open={showDeleteDialog}
          onCancel={() => setShowDeleteDialog(false)}
          footer={[
            <Button key="cancel" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>,
            <Button
              key="delete"
              type="primary"
              danger
              onClick={handleDeleteAccount}
            >
              确认删除
            </Button>,
          ]}
        >
          <div className="py-4">
            <p>此操作将永久删除您的账号和所有相关数据，包括：</p>
            <ul className="list-disc pl-6 mt-2">
              <li>个人资料和设置</li>
              <li>发布的内容和评论</li>
              <li>所有历史记录</li>
            </ul>
            <p className="mt-4 text-red-500">此操作不可撤销，请确认是否继续？</p>
          </div>
        </Modal>
      </Card>
    </div>
  );
};

export default AccountSettings; 