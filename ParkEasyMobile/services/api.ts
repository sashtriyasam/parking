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
  timeout: 15000, // 15 second timeout — accounts for Render cold starts
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (__DEV__) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }
    
    // Railway sometimes returns a 200 with an "Application not found" HTML/Text body if misconfigured
    if (typeof response.data === 'string' && response.data.includes('Application not found')) {
      const error = new Error(`Infrastructure Error: Railway 404 at ${response.config.url}`);
      console.error(error.message);
      return Promise.reject(error);
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      console.warn(`[API Error] ${error.response?.status || 'Network'} ${error.config?.url}`, error.response?.data || error.message);
    }
    
    const originalRequest = error.config;
    
    // Log infrastructure errors specifically
    if (!error.response) {
      console.error(`Network or Infrastructure Error: ${error.message} [URL: ${originalRequest?.url}]`);
    } else if (error.response.status === 404) {
      console.warn(`API 404: Not found at ${originalRequest?.url}`);
    }

    // Specific handling for timeout errors (Render cold starts)
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      const timeoutError = new Error('REQUEST_TIMEOUT');
      (timeoutError as any).isTimeout = true;
      return Promise.reject(timeoutError);
    }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          if (!accessToken) {
            throw new Error('Invalid refresh response');
          }
          await SecureStore.setItemAsync('accessToken', accessToken);
          if (newRefresh !== undefined && newRefresh !== null && typeof newRefresh === 'string' && newRefresh.length > 0) {
            await SecureStore.setItemAsync('refreshToken', newRefresh);
          }
          if (originalRequest?.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          // No refresh token available, force logout
          throw new Error('No refresh token');
        }
      } catch (refreshError: unknown) {
        // Professional Proactive Session Cleanup:
        // Automatically clears memory & store, then redirects via RootLayout.
        const errorMsg = refreshError instanceof Error ? refreshError.message : String(refreshError);
        console.error(`Session expired [${errorMsg}]. Universal authentication gateway reset.`);
        
        try {
          await useAuthStore.getState().logout();
        } catch (logoutError) {
          console.error('Logout failed during session expiration handling:', logoutError);
        }
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
