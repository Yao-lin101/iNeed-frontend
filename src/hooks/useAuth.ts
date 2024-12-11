import { useState, useEffect } from 'react';
import { message } from 'antd';
import { request } from '../utils/request';
import { getToken, setToken, getUser, setUser, clearAuth } from '../utils/auth';
import type { User } from '../types/chat';

export function useAuth() {
  const [user, setCurrentUser] = useState<User | null>(getUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken() && !user) {
      fetchUserInfo();
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const response = await request.get('/users/profile/');
      const userData = response.data;
      setCurrentUser(userData);
      setUser(userData);
    } catch (error) {
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const response = await request.post('/users/login/', {
        username,
        password,
      });
      const { token, user: userData } = response.data;
      setToken(token);
      setCurrentUser(userData);
      setUser(userData);
      message.success('登录成功');
      return true;
    } catch (error) {
      message.error('登录失败');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    setCurrentUser(null);
    message.success('已退出登录');
  };

  return {
    user,
    loading,
    login,
    logout,
  };
} 