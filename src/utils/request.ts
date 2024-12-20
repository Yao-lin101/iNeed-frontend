import axios from 'axios';
import { message } from 'antd';
import { getToken } from './auth';

const request = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          message.error('请先登录');
          break;
        case 403:
          message.error('没有权限');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误');
          break;
        default:
          message.error(data.message || '请求失败');
      }
    } else if (error.request) {
      message.error('网络错误');
    } else {
      message.error('请求配置错误');
    }
    return Promise.reject(error);
  }
);

export { request }; 