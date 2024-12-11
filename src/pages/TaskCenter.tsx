import React, { useState, useEffect } from 'react';
import { Input, Card, Row, Col, Pagination, Button, Spin, Empty } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { taskService, Task } from '../services/taskService';
import TaskDetailModal from '@/components/Task/TaskDetailModal';
import TaskCard from '@/components/Task/TaskCard';

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
                <TaskCard task={task} onClick={handleTaskClick} />
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