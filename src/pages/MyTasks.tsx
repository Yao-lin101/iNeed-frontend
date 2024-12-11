import React, { useState, useEffect } from 'react';
import { Tabs, Card, List, Button, Input, Space, Select, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { taskService, Task } from '../services/taskService';
import TaskDetailModal from '@/components/Task/TaskDetailModal';

const { TabPane } = Tabs;

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

  const renderTaskItem = (task: Task) => {
    return (
      <List.Item
        key={task.id}
        actions={[
          <Button
            key="view"
            type="link"
            onClick={() => handleViewTask(task.id)}
          >
            查看详情
          </Button>,
        ]}
      >
        <List.Item.Meta
          title={
            <div className="flex justify-between">
              <span>{task.title}</span>
              <span className="text-primary">¥{task.reward}</span>
            </div>
          }
          description={
            <div>
              <p className="line-clamp-2">{task.description}</p>
              <div className="flex justify-between text-gray-500 mt-2">
                <div className="space-x-4">
                  <span>状态：{getStatusText(task.status)}</span>
                  {task.assignee && (
                    <span>接取人：{task.assignee.username}</span>
                  )}
                </div>
                <span>截止日期：{task.deadline}</span>
              </div>
            </div>
          }
        />
      </List.Item>
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
            <div className="mb-4 flex justify-between items-center">
              <Space>
                <Input.Search
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
          </TabPane>
          <TabPane tab="我接取的任务" key="assigned">
            <div className="mb-4">
              <Space>
                <Input.Search
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
          </TabPane>
        </Tabs>

        <List
          loading={loading}
          dataSource={tasks}
          renderItem={renderTaskItem}
          pagination={{
            current: currentPage,
            pageSize: 10,
            total: total,
            onChange: (page) => setCurrentPage(page),
          }}
          locale={{
            emptyText: <Empty description="暂无任务" />,
          }}
        />
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