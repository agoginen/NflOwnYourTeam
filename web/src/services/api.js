import axios from 'axios';
import { store } from '../store';
import { logout, setToken } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle different error scenarios
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          if (!originalRequest._retry) {
            originalRequest._retry = true;
            store.dispatch(logout());
            toast.error('Session expired. Please log in again.');
          }
          break;
          
        case 403:
          // Forbidden
          toast.error('Access denied. You do not have permission to perform this action.');
          break;
          
        case 404:
          // Not found
          if (!originalRequest.silent) {
            toast.error('Resource not found.');
          }
          break;
          
        case 429:
          // Rate limited
          toast.error('Too many requests. Please slow down.');
          break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          if (!originalRequest.silent) {
            toast.error('Server error. Please try again later.');
          }
          break;
          
        default:
          // Other errors
          if (!originalRequest.silent && data?.message) {
            toast.error(data.message);
          }
      }
    } else if (error.request) {
      // Network error
      if (!originalRequest.silent) {
        toast.error('Network error. Please check your connection.');
      }
    } else {
      // Other errors
      if (!originalRequest.silent) {
        toast.error('An unexpected error occurred.');
      }
    }
    
    return Promise.reject(error);
  }
);

// API helper methods
export const apiHelpers = {
  // Set auth token
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      store.dispatch(setToken(token));
    } else {
      delete api.defaults.headers.common['Authorization'];
      store.dispatch(setToken(null));
    }
  },
  
  // Make silent request (no error toasts)
  silent: (config) => ({
    ...config,
    silent: true,
  }),
  
  // Upload file
  uploadFile: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },
  
  // Download file
  downloadFile: (url, filename) => {
    return api.get(url, {
      responseType: 'blob',
    }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },
  
  // Health check
  healthCheck: () => {
    return api.get('/health', apiHelpers.silent({}));
  },
};

export default api;
