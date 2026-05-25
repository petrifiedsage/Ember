import axios from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only show toasts for mutation errors or specific known errors
    if (error.config?.method !== 'get') {
      const message = error.response?.data?.detail || error.message || 'An error occurred';
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
