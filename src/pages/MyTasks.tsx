import React, { useState, useEffect } from 'react';
import { Tabs, Card, Row, Col, Button, Input, Space, Select, Empty, Spin, Pagination } from 'antd';
import { useNavigate } from 'react-router-dom';
import { taskService, Task } from '../services/taskService';
import TaskDetailModal from '@/components/Task/TaskDetailModal';
import TaskCard from '@/components/Task/TaskCard';

const { TabPane } = Tabs;
const { Search } = Input;

const MyTasks: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'created' | 'assigned'>('created');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // 加载任务列表
  const loadTasks = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await taskService.getMyTasks({
        page,
        search,
        status,
        type: activeTab,
      });
      setTasks(response.results);
      setTotal(response.count);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(currentPage);
  }, [activeTab, search, status, currentPage]);

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

  // 处理查看详情
  const handleViewTask = (taskId: number) => {
    setSelectedTaskId(taskId);
    setModalVisible(true);
  };

  // 处理关闭弹窗
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTaskId(null);
  };

  // 处理任务状态变化
  const handleTaskStatusChange = () => {
    loadTasks(currentPage);
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
              <TaskCard task={task} onClick={handleViewTask} />
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
          }}
        >
          <TabPane tab="我发布的任务" key="created">
            <div className="mb-6 flex justify-between items-center">
              <Space>
                <Search
                  placeholder="搜索任务标题或描述"
                  allowClear
                  onSearch={(value) => {
                    setSearch(value);
                    setCurrentPage(1);
                  }}
                  style={{ width: 200 }}
                />
                <Select
                  placeholder="选择状态"
                  allowClear
                  options={getStatusOptions()}
                  onChange={(value) => {
                    setStatus(value || '');
                    setCurrentPage(1);
                  }}
                  style={{ width: 120 }}
                />
              </Space>
              <Button type="primary" onClick={() => navigate('/tasks/create')}>
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
                    setSearch(value);
                    setCurrentPage(1);
                  }}
                  style={{ width: 200 }}
                />
                <Select
                  placeholder="选择状态"
                  allowClear
                  options={getStatusOptions()}
                  onChange={(value) => {
                    setStatus(value || '');
                    setCurrentPage(1);
                  }}
                  style={{ width: 120 }}
                />
              </Space>
            </div>
            {renderTaskCards()}
          </TabPane>
        </Tabs>
      </Card>

      <TaskDetailModal
        open={modalVisible}
        taskId={selectedTaskId}
        onClose={handleCloseModal}
        onStatusChange={handleTaskStatusChange}
      />
    </div>
  );
};

export default MyTasks; 