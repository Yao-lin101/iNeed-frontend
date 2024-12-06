import api from './api';

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  verification_code: string;
  phone?: string;
  bio?: string;
}

export interface LoginResponse {
  token: string;
  user_id: number;
  uid: string;
  email: string;
}

export interface UserProfile {
  id: number;
  uid: string;
  username: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  created_at: string;
}

export const authService = {
  login: async (data: LoginData) => {
    const response = await api.post<LoginResponse>('/users/login/', data);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post<LoginResponse>('/users/register/', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/users/logout/');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get<UserProfile>('/users/profile/');
    return response.data;
  },

  updateProfile: async (data: FormData | Partial<UserProfile>) => {
    const headers = data instanceof FormData ? {
      'Content-Type': 'multipart/form-data',
    } : undefined;

    const response = await api.put<UserProfile>('/users/profile/', data, { headers });
    return response.data;
  },

  sendVerificationCode: async (email: string) => {
    const response = await api.post('/users/send-verification-code/', { email });
    return response.data;
  },

  checkUsername: async (username: string) => {
    const response = await api.get('/users/check-username/', {
      params: { username }
    });
    return response.data;
  },
}; 