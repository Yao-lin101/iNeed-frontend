import React, { useState, useEffect } from 'react';
import { Tabs, Row, Col, Button, Input, Radio, Empty, Spin, Pagination, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import TaskDetailModal from '@/components/Task/TaskDetailModal';
import TaskFormModal from '@/components/Task/TaskFormModal';
import TaskCard from '@/components/Task/TaskCard';
import ChatModal from '@/components/Chat/ChatModal';
import { useTaskStore } from '@/models/TaskModel';
import { request } from '@/utils/request';
import type { RadioChangeEvent } from 'antd';

const { TabPane } = Tabs;
const { Search } = Input;

const MyTasks: React.FC = () => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [recipientName, setRecipientName] = useState('');
  
  const { 
    tasks,
    total,
    loading,
    currentPage,
    activeTab,
    status,
    setCurrentPage,
    setSearchValue,
    setActiveTab,
    setStatus,
    loadMyTasks
  } = useTaskStore();

  // 设置默认选中的状态并加载任务
  useEffect(() => {
    if (activeTab === 'created') {
      setStatus('submitted');
    } else {
      setStatus('in_progress');
    }
    loadMyTasks(1); // 加载任务列表
  }, [activeTab]);

  // 获取状态选项
  const getStatusOptions = () => {
    if (activeTab === 'created') {
      return [
        { value: 'submitted', label: '待审核' },
        { value: 'in_progress', label: '进行中' },
        { value: 'pending', label: '待接取' },
        { value: 'rejected', label: '已拒绝' },
        { value: 'cancelled', label: '已取消' },
        { value: 'completed', label: '已完成' },
        { value: 'expired', label: '已过期' },
        { value: 'system_cancelled', label: '系统取消' },
        { value: '', label: '全部' }
      ];
    } else {
      return [
        { value: 'in_progress', label: '进行中' },
        { value: 'submitted', label: '待审核' },
        { value: 'rejected', label: '已拒绝' },
        { value: 'completed', label: '已完成' },
        { value: 'expired', label: '已过期' },
        { value: '', label: '全部' }
      ];
    }
  };

  const handleStatusChange = (e: RadioChangeEvent) => {
    setStatus(e.target.value);
    setCurrentPage(1);
    loadMyTasks(1);
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
        <Row gutter={[16, 16]}>
          {tasks.map((task) => (
            <Col xs={24} sm={12} md={8} lg={6} key={task.id}>
              <TaskCard
                task={task}
                onContact={handleContact}
              />
            </Col>
          ))}
        </Row>
        <div className="mt-6 flex justify-center">
          <Pagination
            current={currentPage}
            total={total}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
        </div>
      </>
    );
  };

  // 抽取搜索和筛选组件
  const renderSearchAndFilter = (showPublishButton = false) => (
    <div className="mb-6 space-y-4">
      <div className="flex justify-between items-center">
        <Search
          placeholder="搜索任务标题或描述"
          allowClear
          onSearch={(value) => {
            setSearchValue(value);
            setCurrentPage(1);
            loadMyTasks(1);
          }}
          className="max-w-md task-search"
          prefix={<SearchOutlined className="text-gray-400" />}
        />
        {showPublishButton && (
          <Button 
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsFormModalOpen(true)}
            className="publish-task-btn"
          >
            发布任务
          </Button>
        )}
      </div>
      <Radio.Group
        value={status}
        onChange={handleStatusChange}
        optionType="button"
        buttonStyle="solid"
        options={getStatusOptions()}
        className="task-filter-group"
      />
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key as 'created' | 'assigned');
          setCurrentPage(1);
          setSearchValue('');
        }}
        className="task-tabs"
      >
        <TabPane tab="我发布的任务" key="created">
          {renderSearchAndFilter(true)}
          <div className="task-list-container">
            {renderTaskCards()}
          </div>
        </TabPane>
        <TabPane tab="我接取的任务" key="assigned">
          {renderSearchAndFilter()}
          <div className="task-list-container">
            {renderTaskCards()}
          </div>
        </TabPane>
      </Tabs>

      <TaskDetailModal />
      <TaskFormModal
        open={isFormModalOpen}
        onCancel={() => setIsFormModalOpen(false)}
        onSuccess={() => loadMyTasks(currentPage)}
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

export default MyTasks; 