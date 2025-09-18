import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  email: string | null;
  username: string;
  isGuest?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  guestLogin: (username: string) => Promise<void>;
  logout: () => void;
  verifyToken: () => Promise<void>;
  clearError: () => void;
}

const API_BASE_URL = '/api';

// 设置 axios 默认配置
axios.defaults.baseURL = API_BASE_URL;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post('/auth/login', { email, password });
          const { token, user } = response.data;
          
          // 设置 axios 默认请求头
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({ user, token, isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || '登录失败';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      register: async (email: string, password: string, username: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post('/auth/register', { 
            email, 
            password, 
            username 
          });
          const { token, user } = response.data;
          
          // 设置 axios 默认请求头
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({ user, token, isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || '注册失败';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      guestLogin: async (username: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post('/auth/guest', { username });
          const { token, user } = response.data;
          
          // 设置 axios 默认请求头
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({ user, token, isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || '游客登录失败';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        // 清除 axios 默认请求头
        delete axios.defaults.headers.common['Authorization'];
        set({ user: null, token: null, error: null });
      },

      verifyToken: async () => {
        const { token } = get();
        if (!token) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          // 设置请求头
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const response = await axios.get('/auth/verify');
          const { user } = response.data;
          set({ user, isLoading: false });
        } catch (error) {
          // Token 无效，清除状态
          delete axios.defaults.headers.common['Authorization'];
          set({ user: null, token: null, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
    }
  )
);
