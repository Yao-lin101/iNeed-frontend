import { create } from 'zustand';
import { authService, UserProfile } from '../services/auth';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, password2: string, verification_code: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Attempting login for:', email);
      const response = await authService.login({ username: email, password });
      console.log('Login response:', response);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('uid', response.uid);
      
      // 立即加载用户信息
      const user = await authService.getProfile();
      console.log('User profile loaded:', user);
      
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      console.error('Login error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('uid');
      set({
        user: null,
        isAuthenticated: false,
        error: error.response?.data?.detail || '登录失败',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (username: string, email: string, password: string, password2: string, verification_code: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Attempting registration for:', email);
      const response = await authService.register({ 
        username, 
        email, 
        password, 
        password2,
        verification_code
      });
      console.log('Registration response:', response);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('uid', response.uid);
      
      // 立即加载用户信息
      const user = await authService.getProfile();
      console.log('User profile loaded:', user);
      
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      console.error('Registration error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('uid');
      set({
        user: null,
        isAuthenticated: false,
        error: error.response?.data?.detail || '注册失败',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Attempting logout');
      await authService.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('uid');
      set({ user: null, isAuthenticated: false, isLoading: false });
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
      });
    }
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    const uid = localStorage.getItem('uid');
    
    if (!token || !uid) {
      console.log('No token or UID found, clearing auth state');
      localStorage.removeItem('token');
      localStorage.removeItem('uid');
      set({ user: null, isAuthenticated: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      console.log('Loading user profile');
      const user = await authService.getProfile();
      console.log('User profile loaded:', user);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      console.error('Load user error:', error);
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