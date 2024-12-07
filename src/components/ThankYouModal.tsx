import React from 'react';
import { Modal, Button } from 'antd';
import { HeartOutlined } from '@ant-design/icons';

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
    >
      <div className="text-center space-y-4 py-6">
        <p className="text-lg">感谢您一直以来对我们的支持和信任</p>
        <p>我们很遗憾看到您离开，希望未来还能再次相见</p>
        <p className="text-sm text-gray-500">
          您的账号和相关数据已经被安全删除
        </p>
      </div>
    </Modal>
  );
};

export default ThankYouModal; 