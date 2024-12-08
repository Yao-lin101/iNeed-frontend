const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

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
  
  return `${API_BASE_URL}${url}`;
}; 