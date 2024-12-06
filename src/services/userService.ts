import api from './api';

export const deleteAccount = async (): Promise<{ detail: string }> => {
  try {
    const response = await api.post('/users/delete-account/');
    return response.data;
  } catch (error: any) {
    console.error('删除账号失败:', error);
    throw error.response?.data || { detail: '删除账号失败，请稍后重试' };
  }
};
