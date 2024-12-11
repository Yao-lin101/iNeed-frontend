import React, { useState, useEffect } from 'react';
import { Input, Card, Row, Col, Pagination, Button, Spin, Empty, Tag } from 'antd';
import { SearchOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { taskService, Task } from '../services/taskService';
import TaskDetailModal from '@/components/Task/TaskDetailModal';

const { Search } = Input;

const TaskCenter: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // 加载任务列表
  const loadTasks = async (page: number = 1, search: string = '') => {
    setLoading(true);
    try {
      const response = await taskService.getTasks({
        page,
        search,
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

  // 处理任务点击
  const handleTaskClick = (taskId: number) => {
    setSelectedTaskId(taskId);
    setModalVisible(true);
  };

  // 处理发布任务
  const handleCreateTask = () => {
    navigate('/tasks/create');
  };

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

  // 添加关闭modal的处理函数
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTaskId(null);
  };

  // 添加任务状态变化的处理函数
  const handleTaskStatusChange = () => {
    // 重新加载当前页的任务列表
    loadTasks(currentPage, searchValue);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Search
          placeholder="搜索任务标题或描述"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          className="max-w-md"
          onSearch={handleSearch}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreateTask}
        >
          发布任务
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : tasks.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            {tasks.map((task) => (
              <Col xs={24} sm={12} md={8} lg={6} key={task.id}>
                <Card
                  hoverable
                  className="h-[280px] flex flex-col justify-between cursor-pointer"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div>
                    <h3 className="text-lg font-medium mb-2 line-clamp-2">{task.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-3">{task.description}</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between border-t pt-3">
                      <Tag color={getStatusColor(task.status)}>{getStatusText(task.status)}</Tag>
                      <span className="text-xl font-bold text-primary">
                        ¥{task.reward}
                      </span>
                    </div>
                    {task.assignee && (
                      <div className="flex items-center text-gray-500 text-sm">
                        <UserOutlined className="mr-1" />
                        <span>接取人：{task.assignee.username}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          <div className="mt-6 flex justify-center">
            <Pagination
              current={currentPage}
              total={total}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </>
      ) : (
        <Empty description="暂无任务" />
      )}

      <TaskDetailModal
        open={modalVisible}
        taskId={selectedTaskId}
        onClose={handleCloseModal}
        onStatusChange={handleTaskStatusChange}
      />
    </div>
  );
};

export default TaskCenter; 