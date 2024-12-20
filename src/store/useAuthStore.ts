import { create } from 'zustand';
import { authService } from '../services/auth';
import { User } from '../services/userService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, password2: string, verification_code: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  token: localStorage.getItem('token'),

  clearError: () => set({ error: null }),

  setUser: (user) => set({ user }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },

  updateUser: (user) => set({ user }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ username: email, password });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('uid', response.uid);
      
      // 立即加载用户信息
      const user = await authService.getProfile();
      
      set({ user, isAuthenticated: true, isLoading: false, token: response.token });
    } catch (error: any) {
      console.error('Login error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('uid');
      set({
        user: null,
        isAuthenticated: false,
        error: error.response?.data?.detail || '登录失败',
        isLoading: false,
        token: null,
      });
      throw error;
    }
  },

  register: async (username: string, email: string, password: string, password2: string, verification_code: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register({ 
        username, 
        email, 
        password, 
        password2,
        verification_code
      });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('uid', response.uid);
      
      // 立即加载用户信息
      const user = await authService.getProfile();
      
      set({ user, isAuthenticated: true, isLoading: false, token: response.token });
    } catch (error: any) {
      console.error('Registration error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('uid');
      set({
        user: null,
        isAuthenticated: false,
        error: error.response?.data?.detail || '注册失败',
        isLoading: false,
        token: null,
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
      set({ user: null, isAuthenticated: false, isLoading: false, token: null });
    } catch (error: any) {
      console.error('Logout error:', error);
      // 即使注销失败，也清除本地存储和状态
      localStorage.removeItem('token');
      localStorage.removeItem('uid');
      set({
        user: null,
        isAuthenticated: false,
        error: error.response?.data?.detail || '注销失败',
        isLoading: false,
        token: null,
      });
    }
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    const uid = localStorage.getItem('uid');
    
    if (!token || !uid) {
      localStorage.removeItem('token');
      localStorage.removeItem('uid');
      set({ user: null, isAuthenticated: false, token: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const user = await authService.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      console.error('Load user error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('uid');
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        token: null,
        error: error.response?.data?.detail || error.message || '加载用户信息失败'
      });
      throw error;
    }
  },
})); 