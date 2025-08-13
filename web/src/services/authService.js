import api, { apiHelpers } from './api';

export const authService = {
  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    
    if (response.data.success && response.data.token) {
      apiHelpers.setAuthToken(response.data.token);
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  },

  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    
    if (response.data.success && response.data.token) {
      apiHelpers.setAuthToken(response.data.token);
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  },

  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      apiHelpers.setAuthToken(null);
      localStorage.removeItem('token');
    }
    
    return true;
  },

  // Get current user
  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }
    
    apiHelpers.setAuthToken(token);
    const response = await api.get('/auth/me');
    
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/updatedetails', profileData);
    return response.data;
  },

  // Update password
  updatePassword: async (passwordData) => {
    const response = await api.put('/auth/updatepassword', passwordData);
    
    if (response.data.success && response.data.token) {
      apiHelpers.setAuthToken(response.data.token);
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  },

  // Update user settings
  updateSettings: async (settings) => {
    const response = await api.put('/auth/settings', { settings });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgotpassword', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await api.put(`/auth/resetpassword/${token}`, { password });
    
    if (response.data.success && response.data.token) {
      apiHelpers.setAuthToken(response.data.token);
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  },

  // Delete account
  deleteAccount: async (password) => {
    const response = await api.delete('/auth/deleteaccount', {
      data: { password }
    });
    
    // Clear auth on successful deletion
    if (response.data.success) {
      apiHelpers.setAuthToken(null);
      localStorage.removeItem('token');
    }
    
    return response.data;
  },

  // Check if token is valid
  validateToken: async (token) => {
    try {
      apiHelpers.setAuthToken(token);
      const response = await api.get('/auth/me', apiHelpers.silent({}));
      return response.data.success;
    } catch (error) {
      return false;
    }
  },

  // Refresh token (if implemented on backend)
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      
      if (response.data.success && response.data.token) {
        apiHelpers.setAuthToken(response.data.token);
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      // If refresh fails, logout user
      await authService.logout();
      throw error;
    }
  },

  // Get user profile (public info)
  getUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },
};
