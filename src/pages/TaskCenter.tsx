import React, { useEffect, useState } from 'react';
import { Input, Row, Col, Pagination, Button, Spin, Empty, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import TaskCard from '@/components/Task/TaskCard';
import TaskDetailModal from '@/components/Task/TaskDetailModal';
import TaskFormModal from '@/components/Task/TaskFormModal';
import { useTaskStore } from '@/models/TaskModel';
import ChatModal from '@/components/Chat/ChatModal';
import { request } from '@/utils/request';

const { Search } = Input;

const TaskCenter: React.FC = () => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [recipientName, setRecipientName] = useState('');
  
  const { 
    tasks,
    total,
    loading,
    currentPage,
    searchValue,
    loadTasks,
    setCurrentPage,
    setSearchValue,
  } = useTaskStore();

  useEffect(() => {
    loadTasks(currentPage, searchValue);
  }, [currentPage, searchValue]);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1); // 重置页码
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleContact = async (uid: string, username: string) => {
    try {
      const requestData = { recipient_uid: uid };
      const response = await request.post('/chat/conversations/', requestData);
      
      if (!response.data.id) {
        throw new Error('创建对话失败：无效的响应数据');
      }
      
      const conversationId = response.data.id;
      setCurrentConversationId(conversationId);
      setRecipientName(username);
      // 确保在下一个事件循环中执行
      setTimeout(() => {
        setChatModalVisible(true);
      }, 0);
    } catch (error: any) {
      console.error('创建对话失败:', error);
      message.error(error.response?.data?.error || '创建对话失败');
      throw error;
    }
  };

  const renderTaskCards = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      );
    }

    if (tasks.length === 0) {
      return <Empty description="暂无任务" />;
    }

    return (
      <>
        <Row gutter={[12, 12]}>
          {tasks.map((task) => (
            <Col 
              xs={24} 
              sm={12} 
              md={8} 
              lg={6} 
              xl={6}
              xxl={6}
              key={task.id}
            >
              <TaskCard
                task={task}
                onContact={handleContact}
              />
            </Col>
          ))}
        </Row>
        <div className="mt-2 flex justify-center">
          <Pagination
            current={currentPage}
            total={total}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      </>
    );
  };

  return (
    <div className="h-full p-4 bg-gray-50">
      <div className="flex justify-center items-center gap-4 mb-6">
        <div className="w-full max-w-3xl">
          <Search
            placeholder="搜索任务标题或描述"
            allowClear
            enterButton={<SearchOutlined className="text-white" />}
            size="large"
            className="task-search"
            onSearch={handleSearch}
          />
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsFormModalOpen(true)}
          className="publish-task-btn flex-shrink-0 h-10"
        >
          发布任务
        </Button>
      </div>

      {renderTaskCards()}

      <TaskDetailModal />
      <TaskFormModal
        open={isFormModalOpen}
        onCancel={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          loadTasks(currentPage, searchValue);
        }}
      />
      
      {currentConversationId && (
        <ChatModal
          open={chatModalVisible}
          onClose={() => setChatModalVisible(false)}
          conversationId={currentConversationId}
          recipientName={recipientName}
          zIndex={1001}
        />
      )}
    </div>
  );
};

export default TaskCenter;