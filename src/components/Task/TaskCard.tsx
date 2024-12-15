import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button, Avatar, message } from 'antd';
import { UserOutlined, ClockCircleOutlined, MessageOutlined, WarningOutlined } from '@ant-design/icons';
import { Task } from '@/services/taskService';
import { formatDeadline } from '@/utils/date';
import { getMediaUrl } from '@/utils/url';
import { useAuthStore } from '@/store/useAuthStore';
import { useTaskStore } from '@/models/TaskModel';
import ChatModal from '@/components/Chat/ChatModal';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { NeonGradientCard } from '@/components/NeonGradientCard';
import { RainbowButton } from '@/components/RainbowButton';

interface TaskCardProps {
  task: Task;
  onContact: (uid: string, username: string) => Promise<void>;
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

// 获取状态的类名
const getStatusClassName = (status: string) => {
  return status.replace('_', '-');
};

// 获取报酬等级
const getRewardLevel = (reward: number) => {
  if (reward < 100) return 1;
  if (reward < 500) return 2;
  if (reward < 1000) return 3;
  if (reward < 5000) return 4;
  return 5;
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onContact }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { user } = useAuthStore();
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [currentConversationId] = useState<number | null>(null);
  const { 
    setSelectedTaskId, 
    setModalVisible, 
    setModalContext,
    loadTaskDetail,
    selectedTaskId,
    modalVisible
  } = useTaskStore();

  // 计算报酬等级
  const rewardLevel = useMemo(() => getRewardLevel(task.reward), [task.reward]);

  // 判断当前任务是否被选中
  const isSelected = selectedTaskId === task.id && modalVisible;

  // 监听模态框状态，当关闭时将卡片翻转回正面
  useEffect(() => {
    if (!modalVisible && isFlipped) {
      setIsFlipped(false);
    }
  }, [modalVisible]);

  const handleMouseEnter = () => {
    if (!isSelected) {
      setIsFlipped(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isSelected) {
      setIsFlipped(false);
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    // 如果点击的是按钮，阻止卡片的点击事件
    if ((e.target as HTMLElement).tagName === 'BUTTON') {
      e.stopPropagation();
      return;
    }
    
    // 设置选中的任务ID和模态框上下文
    setSelectedTaskId(task.id);
    setModalContext(window.location.pathname === '/my-tasks' ? 'myTasks' : 'taskCenter');
    setModalVisible(true);
    
    // 加载任务详情
    await loadTaskDetail(task.id);
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
      await onContact(contactButton.uid, userToShow.username);
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建对话失败');
    }
  };

  const cardStyle = {
    transition: 'all 0.3s ease-in-out',
    opacity: isSelected ? 0 : 1,
    transform: isSelected ? 'scale(0.9)' : 'scale(1)',
    pointerEvents: isSelected ? 'none' as const : 'auto' as const,
    height: '280px',
  };

  // 计算剩余时间
  const getRemainingTime = () => {
    // 只有待接取和进行中的任务才显示倒计时
    if (task.status !== 'pending' && task.status !== 'in_progress') {
      return null;
    }

    const now = dayjs();
    const deadline = dayjs(task.deadline);
    const minutes = deadline.diff(now, 'minute');
    
    // 如果剩余不到1小时
    if (minutes < 60) {
      return {
        type: 'urgent',
        text: `${minutes}分钟后截止`
      };
    }
    
    const hours = Math.floor(minutes / 60);
    // 如果剩余不到24小时
    if (hours < 24) {
      return {
        type: 'urgent',
        text: `${hours}小时后截止`
      };
    }
    
    const days = Math.floor(hours / 24);
    // 如果剩余不到3天
    if (days <= 3) {
      return {
        type: 'warning',
        text: `${days}天后截止`
      };
    }
    
    return {
      type: 'normal',
      text: `${days}天后截止`
    };
  };

  const remainingTime = useMemo(() => getRemainingTime(), [task.deadline, task.status]);

  // 渲染卡片内容
  const renderCardContent = () => (
    <div className="flex flex-col items-center justify-center flex-grow">
      {rewardLevel === 5 ? (
        // 最高等级使用渐变字
        <span className="pointer-events-none z-10 text-4xl font-bold mb-4 gradient-text">
          ¥{task.reward}
        </span>
      ) : (
        <span className={`text-4xl font-bold mb-4 reward-text-${rewardLevel}`}>
          ¥{task.reward}
        </span>
      )}
      <p className={classNames(
        "text-sm line-clamp-3 text-center max-w-[90%]",
        rewardLevel === 5 ? "text-white/80" : "text-gray-500"
      )}>
        {task.description}
      </p>
      <div className="w-full mt-4 flex flex-col items-center border-t pt-3">
        {remainingTime && (
          <span className={classNames(
            'countdown-tag',
            `countdown-${remainingTime.type}`,
            'mb-2',
            rewardLevel === 5 && 'gradient-bg border border-white/30'
          )}>
            <WarningOutlined className={rewardLevel === 5 ? "mr-1 text-[var(--gradient-from)]" : "mr-1"} />
            {rewardLevel === 5 ? (
              <span className="gradient-text font-medium">
                {remainingTime.text}
              </span>
            ) : (
              <span>{remainingTime.text}</span>
            )}
          </span>
        )}
        <span className={classNames(
          'task-tag',
          'mb-2',
          getStatusClassName(task.status),
          rewardLevel === 5 && 'gradient-bg border border-white/30'
        )}>
          {rewardLevel === 5 ? (
            <span className="gradient-text font-medium">
              {getStatusText(task.status)}
            </span>
          ) : (
            <span>{getStatusText(task.status)}</span>
          )}
        </span>
        {rewardLevel === 5 ? (
          <h3 className="text-lg font-medium text-center line-clamp-2 max-w-[95%] px-2 gradient-text">
            {task.title}
          </h3>
        ) : (
          <h3 className={classNames(
            "text-lg font-medium text-center line-clamp-2 max-w-[95%] px-2",
            `reward-text-${rewardLevel}`
          )}>
            {task.title}
          </h3>
        )}
      </div>
    </div>
  );

  // 渲染卡片背面内容
  const renderBackContent = (isNeon: boolean = false) => (
    <div className={classNames(
      "flex flex-col items-center justify-between h-full",
      isNeon && "text-white"
    )}>
      <div className="flex flex-col items-center justify-center gap-6 w-full p-4">
        <div className="flex flex-col items-center">
          <Avatar
            size={64}
            src={getMediaUrl(userToShow.avatar)}
            icon={<UserOutlined />}
            className="mb-2 hover:scale-105 transition-transform"
          />
          {isNeon ? (
            <span className="font-medium gradient-text">
              {getRoleText()}：{userToShow.username}
            </span>
          ) : (
            <span className="font-medium text-gray-500">
              {getRoleText()}：{userToShow.username}
            </span>
          )}
        </div>
        {contactButton.show && (
          isNeon ? (
            <RainbowButton
              onClick={(e) => {
                e.stopPropagation();
                handleContact();
              }}
              className="!p-0 min-w-[120px] flex items-center justify-center gap-1"
            >
              <MessageOutlined className="text-[var(--gradient-from)]" />
              <span className="gradient-text font-medium">
                {contactButton.text}
              </span>
            </RainbowButton>
          ) : (
            <Button
              type="text"
              icon={<MessageOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleContact();
              }}
              className="contact-btn flex items-center gap-1 !p-0 text-blue-500 hover:text-blue-400"
            >
              {contactButton.text}
            </Button>
          )
        )}
      </div>
      <div className={classNames(
        "w-full border-t pt-3 pb-2 text-center",
        isNeon ? "border-white/20" : "border-gray-200 text-gray-500"
      )}>
        <div className={classNames(
          "flex items-center justify-center",
          isNeon && "gradient-text"
        )}>
          <ClockCircleOutlined className={isNeon ? "mr-2 text-[var(--gradient-from)]" : "mr-2"} />
          <span>{formatDeadline(task.deadline)}</span>
        </div>
      </div>
    </div>
  );

  // 根据等级返回不同的卡片组件
  const CardComponent = rewardLevel === 5 ? (
    <NeonGradientCard
      className="h-[280px] cursor-pointer"
      neonColors={{
        firstColor: "var(--gradient-from)",
        secondColor: "var(--gradient-to)"
      }}
      borderSize={2}
      borderRadius={8}
    >
      {renderCardContent()}
    </NeonGradientCard>
  ) : (
    <Card
      className={`h-[280px] reward-level-${rewardLevel}`}
      bordered
    >
      {renderCardContent()}
    </Card>
  );

  return (
    <>
      <div
        className="perspective-1000 relative"
        style={cardStyle}
        data-level={rewardLevel}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 光晕层移到最外层 */}
        {rewardLevel === 5 && (
          <div 
            className="absolute inset-0 neon-glow"
            style={{
              background: `radial-gradient(circle at 50% 50%, 
                var(--gradient-from-transparent) 0%,
                var(--gradient-to-transparent) 50%,
                transparent 70%
              )`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* 卡片容器 */}
        <div className="relative w-full h-full" style={{ zIndex: 1 }}>
          <div 
            className={`w-full h-full transition-transform duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* 卡片正面 */}
            <div className="absolute w-full h-full backface-hidden" onClick={handleClick}>
              {CardComponent}
            </div>

            {/* 卡片背面 */}
            {rewardLevel === 5 ? (
              <NeonGradientCard
                className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-between cursor-pointer"
                neonColors={{
                  firstColor: "var(--gradient-from)",
                  secondColor: "var(--gradient-to)"
                }}
                borderSize={2}
                borderRadius={8}
                onClick={handleClick}
              >
                {renderBackContent(true)}
              </NeonGradientCard>
            ) : (
              <Card
                className={`absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-between reward-level-${rewardLevel}`}
                bordered
                onClick={handleClick}
              >
                {renderBackContent(false)}
              </Card>
            )}
          </div>
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