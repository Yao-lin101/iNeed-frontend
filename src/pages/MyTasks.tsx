import React, { useState, useEffect } from 'react';
import { Tabs, Card, Row, Col, Button, Input, Radio, Empty, Spin, Pagination } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import TaskDetailModal from '@/components/Task/TaskDetailModal';
import TaskFormModal from '@/components/Task/TaskFormModal';
import TaskCard from '@/components/Task/TaskCard';
import { useTaskStore } from '@/models/TaskModel';
import type { RadioChangeEvent } from 'antd';
import classNames from 'classnames';

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
    <div className="p-6 min-h-[calc(100vh-64px)] bg-gray-50">
      <Card 
        bordered={false}
        className="shadow-sm rounded-lg"
      >
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
                <Button 
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsFormModalOpen(true)}
                  className="publish-task-btn"
                >
                  发布任务
                </Button>
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
            <div className="task-list-container">
              {renderTaskCards()}
            </div>
          </TabPane>
          <TabPane tab="我接取的任务" key="assigned">
            <div className="mb-6 space-y-4">
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
              <Radio.Group
                value={status}
                onChange={handleStatusChange}
                optionType="button"
                buttonStyle="solid"
                options={getStatusOptions()}
                className="task-filter-group"
              />
            </div>
            <div className="task-list-container">
              {renderTaskCards()}
            </div>
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