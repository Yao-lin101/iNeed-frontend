import React, { useEffect, useState } from 'react';
import { Input, Row, Col, Pagination, Button, Spin, Empty } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import TaskCard from '@/components/Task/TaskCard';
import TaskDetailModal from '@/components/Task/TaskDetailModal';
import TaskFormModal from '@/components/Task/TaskFormModal';
import { useTaskStore } from '@/models/TaskModel';
import '../styles/components/TaskCenter.css';

const { Search } = Input;

const TaskCenter: React.FC = () => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const { 
    tasks,
    total,
    loading,
    currentPage,
    searchValue,
    loadTasks,
    setCurrentPage,
    setSearchValue
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

  return (
    <div className="p-6">
      <div className="flex justify-center items-center gap-4 mb-6">
        <div className="w-full max-w-2xl">
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
          className="publish-task-btn flex-shrink-0"
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
                <TaskCard task={task} />
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

      <TaskDetailModal />
      <TaskFormModal
        open={isFormModalOpen}
        onCancel={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          loadTasks(currentPage, searchValue);
        }}
      />
    </div>
  );
};

export default TaskCenter;