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
      // Import the local credentials
      const { AUTH_USERS } = await import('../utils/authCredentials');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const user = AUTH_USERS.find(u => u.email === email && u.password === password);

      if (user) {
        // Create a mock response that matches what the backend would return
        const mockData = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: `mock-jwt-token-${user._id}-${Date.now()}`
        };

        localStorage.setItem('user', JSON.stringify(mockData));
        localStorage.setItem('token', mockData.token);
        set({ user: mockData, token: mockData.token, isLoading: false });
        return true;
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login Error:', error.message);
      set({
        error: error.message,
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
