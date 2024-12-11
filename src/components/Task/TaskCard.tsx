import React, { useState } from 'react';
import { Card, Tag, Button, Avatar, message } from 'antd';
import { UserOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons';
import { Task } from '@/services/taskService';
import { chatService } from '@/services/chatService';
import { request } from '@/utils/request';
import { formatDeadline } from '@/utils/date';
import { getMediaUrl } from '@/utils/url';
import { useAuthStore } from '@/store/useAuthStore';
import ChatModal from '@/components/Chat/ChatModal';

interface TaskCardProps {
  task: Task;
  onClick: (taskId: number) => void;
}

// 获取状态的中文描述
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待接取',
    in_progress: '进行中',
    submitted: '待审核',
    completed: '已完成',
    rejected: '已拒绝',
    cancelled: '已取消',
    system_cancelled: '系统取消',
    expired: '已过期'
  };
  return textMap[status] || status;
};

// 获取状态标签的颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: 'default',
    in_progress: 'processing',
    submitted: 'warning',
    completed: 'success',
    rejected: 'error',
    cancelled: 'error',
    system_cancelled: 'error',
    expired: 'error'
  };
  return colorMap[status] || 'default';
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { user } = useAuthStore();
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);

  const handleMouseEnter = () => {
    setIsFlipped(true);
  };

  const handleMouseLeave = () => {
    setIsFlipped(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮，阻止卡片的点击事件
    if ((e.target as HTMLElement).tagName === 'BUTTON') {
      e.stopPropagation();
      return;
    }
    onClick(task.id);
  };

  // 获取要显示的用户信息
  const isCreator = user?.id === task.creator.id;
  const isAssignee = user?.id === task?.assignee?.id;

  // 决定显示哪个用户的信息
  const userToShow = (() => {
    if (isCreator) {
      // 如果当前用户是委托人
      return task.assignee || task.creator;
    } else {
      // 如果当前用户是接取人或其他用户
      return task.creator;
    }
  })();

  // 决定是否显示联系按钮和按钮文本
  const contactButton = (() => {
    if (isCreator) {
      // 如果当前用户是委托人，只有在有接取人时才显示联系按钮
      return task.assignee ? {
        show: true,
        text: '联系接取人',
        uid: task.assignee.uid
      } : {
        show: false,
        text: '',
        uid: null
      };
    } else {
      // 如果当前用户不是委托人，显示联系委托人按钮
      return {
        show: true,
        text: '联系委托人',
        uid: task.creator.uid
      };
    }
  })();

  // 获取用户角色显示文本
  const getRoleText = () => {
    if (isCreator) {
      return task.assignee ? '接取人' : '委托人（我）';
    } else if (isAssignee) {
      return '委托人';
    } else {
      return '委托人';
    }
  };

  // 处理联系用户
  const handleContact = async () => {
    if (!contactButton.uid) {
      message.error('无法获取用户信息');
      return;
    }
    
    try {
      const requestData = { recipient_uid: contactButton.uid };
      const response = await request.post('/chat/conversations/', requestData);
      
      if (!response.data.id) {
        message.error('创建对话失败：无效的响应数据');
        return;
      }
      
      const conversationId = response.data.id;
      setCurrentConversationId(conversationId);
      setChatModalVisible(true);

      try {
        await chatService.markAsRead(conversationId);
      } catch (error) {
        console.error('标记已读失败:', error);
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建对话失败');
    }
  };

  return (
    <>
      <div
        className="h-[280px] perspective-1000 cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onClick={handleClick}
        >
          {/* 卡片正面 */}
          <Card
            className="absolute w-full h-full backface-hidden flex flex-col items-center justify-between"
            bordered
          >
            <div className="flex flex-col items-center justify-center flex-grow">
              <span className="text-3xl font-bold text-primary mb-4">
                ¥{task.reward}
              </span>
              <p className="text-gray-500 text-sm line-clamp-3 text-center max-w-[90%]">
                {task.description}
              </p>
            </div>
            <div className="w-full mt-4 flex flex-col items-center border-t pt-3">
              <Tag color={getStatusColor(task.status)} className="mb-2">
                {getStatusText(task.status)}
              </Tag>
              <h3 className="text-lg font-medium text-center line-clamp-2 max-w-[95%] px-2">
                {task.title}
              </h3>
            </div>
          </Card>

          {/* 卡片背面 */}
          <Card
            className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-between"
            bordered
          >
            <div className="flex flex-col items-center justify-center gap-6 w-full p-4">
              <div className="flex flex-col items-center">
                <Avatar
                  size={64}
                  src={getMediaUrl(userToShow.avatar)}
                  icon={<UserOutlined />}
                  className="mb-2"
                />
                <span className="text-gray-500 font-medium">
                  {getRoleText()}：{userToShow.username}
                </span>
              </div>
              {contactButton.show && (
                <Button
                  type="primary"
                  icon={<MessageOutlined />}
                  size="large"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContact();
                  }}
                >
                  {contactButton.text}
                </Button>
              )}
            </div>
            <div className="w-full border-t pt-3 pb-2 text-center text-gray-500">
              <div className="flex items-center justify-center">
                <ClockCircleOutlined className="mr-2" />
                <span>{formatDeadline(task.deadline)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ChatModal
        open={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        conversationId={currentConversationId}
        recipientName={userToShow.username}
        zIndex={1001}
      />
    </>
  );
};

export default TaskCard; 