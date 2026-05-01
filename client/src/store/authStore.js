import { create } from 'zustand';
import axiosInstance from '../services/api/axiosInstance';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.post('/auth/login', { email, password });
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      set({ user: data, token: data.token, isLoading: false });
      return true;
    } catch (error) {
      console.error('Login Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      set({
        error: error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
