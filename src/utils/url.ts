const API_BASE_URL = 'http://127.0.0.1:8000';

export const getMediaUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
}; 