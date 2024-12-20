import axios from 'axios';
import { message } from 'antd';
import { getToken } from './auth';

// 在开发环境中，baseURL 为空，让 Vite 的代理处理 /api 前缀
// 在生产环境中，使用完整的 API URL
const baseURL = import.meta.env.DEV 
  ? ''  // 开发环境：使用 Vite 的代理
  : import.meta.env.VITE_API_BASE_URL;  // 生产环境：使用完整的 URL

const request = axios.create({
  baseURL,
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    // 所有请求都需要添加 /api 前缀
    if (!config.url?.startsWith('/api')) {
      config.url = `/api${config.url}`;
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