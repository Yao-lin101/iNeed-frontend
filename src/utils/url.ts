const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');

/**
 * 处理媒体文件 URL
 * @param url 相对或绝对 URL
 * @returns 完整的媒体文件 URL
 */
export const getMediaUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  
  // 如果 url 不是以 /media/ 开头，添加它
  if (!url.startsWith('/media/')) {
    url = `/media/${url}`;
  }
  
  // 开发环境使用原始 URL，生产环境使用 HTTPS
  return import.meta.env.DEV 
    ? `${API_BASE_URL}${url}`
    : `${API_BASE_URL.replace('http://', 'https://')}${url}`;
};

/**
 * 获取 WebSocket URL
 * @param path 相对路径
 * @returns 完整的 WebSocket URL
 */
export const getWebSocketUrl = (path: string): string => {
  if (path.startsWith('ws://') || path.startsWith('wss://')) {
    return path;
  }
  return `${WS_BASE_URL}${path}`;
}; 