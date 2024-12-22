import { create } from 'zustand';
import { taskService, Task } from '@/services/taskService';
import { message } from 'antd';

interface TaskState {
  // 任务列表数据
  tasks: Task[];
  total: number;
  loading: boolean;
  currentPage: number;
  searchValue: string;
  
  // 任务详情数据
  selectedTask: Task | null;
  selectedTaskId: number | null;
  detailLoading: boolean;
  modalVisible: boolean;

  // 我的任务相关
  activeTab: 'created' | 'assigned';
  status: string;

  // 任务列表操作
  setTasks: (tasks: Task[]) => void;
  setTotal: (total: number) => void;
  setLoading: (loading: boolean) => void;
  setCurrentPage: (page: number) => void;
  setSearchValue: (value: string) => void;
  loadTasks: (page?: number, search?: string) => Promise<void>;
  loadMyTasks: (page?: number) => Promise<void>;

  // 任务详情操作
  setSelectedTask: (task: Task | null) => void;
  setSelectedTaskId: (id: number | null) => void;
  setDetailLoading: (loading: boolean) => void;
  setModalVisible: (visible: boolean) => void;
  loadTaskDetail: (taskId: number) => Promise<void>;
  
  // 我的任务操作
  setActiveTab: (tab: 'created' | 'assigned') => void;
  setStatus: (status: string) => void;
  
  // 状态重置
  resetState: () => void;

  // 弹窗上下文
  modalContext: 'myTasks' | 'taskCenter' | 'notification' | null;
  setModalContext: (context: 'myTasks' | 'taskCenter' | 'notification' | null) => void;
}

const initialState = {
  tasks: [],
  total: 0,
  loading: false,
  currentPage: 1,
  searchValue: '',
  selectedTask: null,
  selectedTaskId: null,
  detailLoading: false,
  modalVisible: false,
  activeTab: 'created' as const,
  status: '',
  modalContext: null,
};

export const useTaskStore = create<TaskState>((set, get) => ({
  ...initialState,

  // 任务列表操作
  setTasks: (tasks) => set({ tasks }),
  setTotal: (total) => set({ total }),
  setLoading: (loading) => set({ loading }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSearchValue: (value) => set({ searchValue: value }),

  loadTasks: async (page = 1, search = '') => {
    set({ loading: true });
    try {
      const response = await taskService.getTasks({ 
        page, 
        search,
        page_size: 20  // 确保与前端分页大小一致
      });
      set({
        tasks: response.results,
        total: response.count,
        loading: false,
        currentPage: page
      });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      set({ loading: false });
    }
  },

  loadMyTasks: async (page: number = 1) => {
    set({ loading: true });
    try {
      const response = await taskService.getMyTasks({
        page,
        status: get().status,
        search: get().searchValue,
        type: get().activeTab
      });
      
      set({
        tasks: response.results,
        total: response.count,
        loading: false,
        currentPage: page
      });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      set({ loading: false });
    }
  },

  // 任务详情操作
  setSelectedTask: (task) => set({ selectedTask: task }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setDetailLoading: (loading) => set({ detailLoading: loading }),
  setModalVisible: (visible) => set({ modalVisible: visible }),

  loadTaskDetail: async (taskId) => {
    const { setDetailLoading, setSelectedTask } = get();
    setDetailLoading(true);
    try {
      const task = await taskService.getTask(taskId);
      setSelectedTask(task);
    } catch (error) {
      console.error('Failed to load task detail:', error);
      message.error('加载任务详情失败');
    } finally {
      setDetailLoading(false);
    }
  },

  // 我的任务操作
  setActiveTab: (tab) => set({ activeTab: tab }),
  setStatus: (status) => set({ status }),

  // 状态重置
  resetState: () => {
    set({
      selectedTask: null,
      selectedTaskId: null,
      detailLoading: false,
      modalVisible: false,
    });
  },

  // 弹窗上下文
  setModalContext: (context) => set({ modalContext: context }),
})); 