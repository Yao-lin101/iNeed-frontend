import api from './api';

export interface Task {
  id: number;
  title: string;
  description: string;
  creator: {
    id: number;
    uid: string;
    username: string;
    email: string;
    avatar?: string;
  };
  assignee?: {
    id: number;
    uid: string;
    username: string;
    email: string;
    avatar?: string;
  };
  status: 'pending' | 'in_progress' | 'submitted' | 'completed' | 'rejected' | 'cancelled' | 'system_cancelled' | 'expired';
  required_materials: string;
  deadline: string;
  reward: number;
  completion_note?: string;
  review_note?: string;
  attachments?: string;
  submitted_at?: string;
  reviewed_at?: string;
  expired_at?: string;
  notification_sent?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Task[];
}

export interface TaskListParams {
  page: number;
  search?: string;
  page_size?: number;
  status?: string;
  type?: 'created' | 'assigned';
}

export interface TaskSubmitData {
  completion_note: string;
  attachments?: File;
}

export const taskService = {
  /** 获取任务列表 */
  getTasks: async (params: TaskListParams): Promise<TaskListResponse> => {
    const response = await api.get('/tasks/tasks/', { params });
    return response.data;
  },

  /** 获取我的任务 */
  getMyTasks: async (params: TaskListParams): Promise<TaskListResponse> => {
    const response = await api.get('/tasks/tasks/my/', { params });
    return response.data;
  },

  /** 获取单个任务详情 */
  getTask: async (taskId: number): Promise<Task> => {
    const response = await api.get(`/tasks/tasks/${taskId}/`);
    return response.data;
  },

  /** 创建任务 */
  createTask: async (taskData: Partial<Task>): Promise<Task> => {
    const response = await api.post('/tasks/tasks/', taskData);
    return response.data;
  },

  /** 更新任务 */
  updateTask: async (taskId: number, taskData: Partial<Task>): Promise<Task> => {
    const response = await api.put(`/tasks/tasks/${taskId}/`, taskData);
    return response.data;
  },

  /** 删除任务 */
  deleteTask: async (taskId: number): Promise<void> => {
    await api.delete(`/tasks/tasks/${taskId}/`);
  },

  /** 接取任务 */
  takeTask: async (taskId: number): Promise<void> => {
    await api.post(`/tasks/tasks/${taskId}/take/`);
  },

  /** 提交任务 */
  submitTask: async (taskId: number, data: TaskSubmitData): Promise<void> => {
    const formData = new FormData();
    formData.append('completion_note', data.completion_note);
    if (data.attachments) {
      formData.append('attachments', data.attachments);
    }
    await api.post(`/tasks/tasks/${taskId}/submit/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /** 审核任务 */
  reviewTask: async (taskId: number, status: 'completed' | 'rejected', review_note: string): Promise<void> => {
    await api.post(`/tasks/tasks/${taskId}/review/`, {
      status,
      review_note,
    });
  },

  /** 取消任务 */
  cancelTask: async (taskId: number): Promise<void> => {
    await api.post(`/tasks/tasks/${taskId}/cancel/`);
  },

  /** 放弃任务 */
  abandonTask: async (taskId: number): Promise<void> => {
    await api.post(`/tasks/tasks/${taskId}/abandon/`);
  },

  /** 重新提交任务 */
  retryTask: async (taskId: number): Promise<void> => {
    await api.post(`/tasks/tasks/${taskId}/retry/`);
  },
}; 