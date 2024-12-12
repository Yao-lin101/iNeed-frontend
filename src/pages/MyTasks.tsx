import React, { useState } from 'react';
import { Tabs, Card, Row, Col, Button, Input, Space, Select, Empty, Spin, Pagination } from 'antd';
import TaskDetailModal from '@/components/Task/TaskDetailModal';
import TaskFormModal from '@/components/Task/TaskFormModal';
import TaskCard from '@/components/Task/TaskCard';
import { useTaskStore } from '@/models/TaskModel';

const { TabPane } = Tabs;
const { Search } = Input;

const MyTasks: React.FC = () => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
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

  // 获取可选的状态过滤选项
  const getStatusOptions = () => {
    if (activeTab === 'created') {
      return [
        { value: 'pending', label: '待接取' },
        { value: 'in_progress', label: '进行中' },
        { value: 'submitted', label: '待审核' },
        { value: 'completed', label: '已完成' },
        { value: 'rejected', label: '已拒绝' },
        { value: 'cancelled', label: '已取消' },
        { value: 'system_cancelled', label: '系统取消' },
        { value: 'expired', label: '已过期' }
      ];
    } else {
      return [
        { value: 'in_progress', label: '进行中' },
        { value: 'submitted', label: '待审核' },
        { value: 'completed', label: '已完成' },
        { value: 'rejected', label: '已拒绝' },
        { value: 'expired', label: '已过期' }
      ];
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
              <TaskCard task={task} />
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

  return (
    <div className="p-6">
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as 'created' | 'assigned');
            setStatus('');
            setCurrentPage(1);
            loadMyTasks(1);
          }}
        >
          <TabPane tab="我发布的任务" key="created">
            <div className="mb-6 flex justify-between items-center">
              <Space>
                <Search
                  placeholder="搜索任务标题或描述"
                  allowClear
                  onSearch={(value) => {
                    setSearchValue(value);
                    setCurrentPage(1);
                    loadMyTasks(1);
                  }}
                  style={{ width: 200 }}
                />
                <Select
                  placeholder="选择状态"
                  allowClear
                  value={status}
                  options={getStatusOptions()}
                  onChange={(value) => {
                    setStatus(value || '');
                    setCurrentPage(1);
                    loadMyTasks(1);
                  }}
                  style={{ width: 120 }}
                />
              </Space>
              <Button type="primary" onClick={() => setIsFormModalOpen(true)}>
                发布任务
              </Button>
            </div>
            {renderTaskCards()}
          </TabPane>
          <TabPane tab="我接取的任务" key="assigned">
            <div className="mb-6">
              <Space>
                <Search
                  placeholder="搜索任务标题或描述"
                  allowClear
                  onSearch={(value) => {
                    setSearchValue(value);
                    setCurrentPage(1);
                    loadMyTasks(1);
                  }}
                  style={{ width: 200 }}
                />
                <Select
                  placeholder="选择状态"
                  allowClear
                  value={status}
                  options={getStatusOptions()}
                  onChange={(value) => {
                    setStatus(value || '');
                    setCurrentPage(1);
                    loadMyTasks(1);
                  }}
                  style={{ width: 120 }}
                />
              </Space>
            </div>
            {renderTaskCards()}
          </TabPane>
        </Tabs>
      </Card>

      <TaskDetailModal />
      <TaskFormModal
        open={isFormModalOpen}
        onCancel={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          loadMyTasks(currentPage);
        }}
      />
    </div>
  );
};

export default MyTasks; 