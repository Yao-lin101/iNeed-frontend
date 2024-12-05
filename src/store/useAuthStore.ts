import { create } from 'zustand';
import { authService, UserProfile } from '../services/auth';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, password2: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ username: email, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('uid', response.uid);
      const user = await authService.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || '登录失败',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (username: string, email: string, password: string, password2: string, phone?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register({ username, email, password, password2, phone });
      localStorage.setItem('token', response.token);
      localStorage.setItem('uid', response.uid);
      const user = await authService.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || '注册失败',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('uid');
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || '注销失败',
        isLoading: false,
      });
    }
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    const uid = localStorage.getItem('uid');
    
    if (!token || !uid) {
      set({ user: null, isAuthenticated: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const user = await authService.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('uid');
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: error.response?.data?.detail || error.message || '加载用户信息失败'
      });
      throw error;
    }
  },
})); 