import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';

// Derive base URL with production safety check
const API_URL = (() => {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url && process.env.NODE_ENV === 'production') {
    throw new Error('Infrastructure Failure: EXPO_PUBLIC_API_URL is missing in production. Cannot initialize API client.');
  }
  return url || 'http://localhost:5000/api/v1';
})();

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    // Railway sometimes returns a 200 with an "Application not found" HTML/Text body if misconfigured
    if (typeof response.data === 'string' && response.data.includes('Application not found')) {
      const error = new Error(`Infrastructure Error: Railway 404 at ${response.config.url}`);
      console.error(error.message);
      return Promise.reject(error);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log infrastructure errors specifically
    if (!error.response) {
      console.error(`Network or Infrastructure Error: ${error.message} [URL: ${originalRequest?.url}]`);
    } else if (error.response.status === 404) {
      console.warn(`API 404: Not found at ${originalRequest?.url}`);
    }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          await SecureStore.setItemAsync('accessToken', res.data.accessToken);
          await SecureStore.setItemAsync('refreshToken', res.data.refreshToken);
          if (originalRequest?.headers) {
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          // No refresh token available, force logout
          throw new Error('No refresh token');
        }
      } catch (refreshError: any) {
        // Professional Proactive Session Cleanup:
        // Automatically clears memory & store, then redirects via RootLayout.
        await useAuthStore.getState().logout();
        console.error('Session expired. Universal authentication gateway reset.');
        return Promise.reject(new Error('AUTHENTICATION_EXPIRED'));
      }
    }
    return Promise.reject(error);
  }
);

export const get = (url: string, config = {}) => apiClient.get(url, config);
export const post = (url: string, data?: any, config = {}) => apiClient.post(url, data, config);
export const put = (url: string, data?: any, config = {}) => apiClient.put(url, data, config);
export const patch = (url: string, data?: any, config = {}) => apiClient.patch(url, data, config);
export const del = (url: string, config = {}) => apiClient.delete(url, config);

export default apiClient;
