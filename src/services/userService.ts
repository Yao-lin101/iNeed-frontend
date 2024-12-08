import api from './api';

export interface User {
  id: number;
  uid: string;
  username: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  email_notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskStatus {
  has_active_tasks: boolean;
  created_active_tasks: number;
  assigned_active_tasks: number;
  total_created_tasks: number;
  total_assigned_tasks: number;
  created_tasks_by_status: {
    pending: number;
    in_progress: number;
    submitted: number;
  };
  assigned_tasks_by_status: {
    in_progress: number;
    submitted: number;
  };
}

export interface DeleteAccountError {
  detail: string;
  reason: string;
  active_tasks: string[];
  task_status: TaskStatus;
}

export interface TaskStatusResponse {
  detail: string;
  task_results?: {
    cancelled_tasks: number;
  };
}

export interface UpdateProfileData {
  username?: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar?: File;
  email_notification_enabled?: boolean;
}

export const userService = {
  /** 获取当前用户信息 */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/users/profile/');
    return response.data;
  },

  /** 更新用户资料 */
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'email_notification_enabled') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value);
        }
      }
    });
    const response = await api.patch('/users/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /** 检查账号状态 */
  checkAccountStatus: async (): Promise<void> => {
    try {
      await api.head('/users/delete-account/');
    } catch (error: any) {
      if (error.response?.data?.active_tasks) {
        throw {
          ...error,
          response: {
            ...error.response,
            data: error.response.data as DeleteAccountError
          }
        };
      }
      throw error;
    }
  },

  /** 取消待处理的任务 */
  cancelPendingTasks: async (): Promise<TaskStatusResponse> => {
    const response = await api.post('/users/cancel-pending-tasks/');
    return response.data;
  },

  /** 删除账号 */
  deleteAccount: async (): Promise<void> => {
    await api.post('/users/delete-account/');
  },

  /** 导出这些函数以保持向后兼容性 */
  checkStatus: async (): Promise<void> => {
    return userService.checkAccountStatus();
  },
};
