import React from 'react';
import { Modal, Button, Divider } from 'antd';
import { HeartOutlined, SafetyOutlined, UndoOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

interface ThankYouModalProps {
  open: boolean;
  onClose: () => void;
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({ open, onClose }) => {
  return (
    <Modal
      title={
        <div className="text-center">
          <HeartOutlined className="text-2xl text-red-500" />
          <span className="ml-2">感谢您的使用</span>
        </div>
      }
      open={open}
      footer={[
        <Button key="ok" type="primary" onClick={onClose}>
          确定
        </Button>,
      ]}
      closable={false}
      maskClosable={false}
      centered
      width={480}
    >
      <div className="text-center space-y-6 py-6">
        <div>
          <p className="text-lg mb-2">感谢您一直以来对我们的支持和信任</p>
          <p>我们很遗憾看到您离开，希望未来还能再次相见</p>
        </div>

        <Divider />

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-center mb-3">
            <SafetyOutlined className="text-green-600 text-xl" />
            <span className="ml-2 font-medium">数据处理说明</span>
          </div>
          <ul className="text-sm text-gray-600 text-left space-y-2">
            <li>• 您的个人资料已被安全删除</li>
            <li>• 您创建的任务已被取消或归档</li>
            <li>• 您的聊天记录已被清除</li>
            <li>• 您的邮箱地址已从通知列表中移除</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-center mb-3">
            <UndoOutlined className="text-blue-600 text-xl" />
            <span className="ml-2 font-medium">账号恢复说明</span>
          </div>
          <div className="text-sm text-gray-600">
            <p className="mb-2">如果您改变主意，可以在180天内重新激活账号：</p>
            <ul className="text-left space-y-2">
              <li>• 使用原邮箱地址可以恢复账号</li>
              <li>• 您的历史任务记录将被保留</li>
              <li>• 重新激活后可以立即使用所有功能</li>
            </ul>
            <Link 
              to="/reactivate" 
              className="text-blue-600 hover:text-blue-700 block mt-3"
              onClick={onClose}
            >
              前往重新激活账号
            </Link>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <p>如果超过180天未重新激活</p>
          <p>您可以使用新的邮箱地址重新注册账号</p>
        </div>
      </div>
    </Modal>
  );
};

export default ThankYouModal; 