import api from './api';

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

export const checkAccountStatus = async (): Promise<void> => {
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
};

export const cancelPendingTasks = async (): Promise<TaskStatusResponse> => {
  const response = await api.post('/users/cancel-pending-tasks/');
  return response.data;
};

export const deleteAccount = async (): Promise<void> => {
  await api.post('/users/delete-account/');
};
