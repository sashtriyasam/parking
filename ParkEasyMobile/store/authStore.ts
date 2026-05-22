import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { User } from '../types';
import { disconnectSocket } from '../hooks/useSocket';

interface AuthState {
  user: User | null;
  // NOTE: accessToken is stored here in-memory, but the api.ts request interceptor 
  // reads the token fresh from SecureStore.getItemAsync('accessToken') on every request.
  // Exposing this here is technically redundant/misleading, but DO NOT remove or modify 
  // how it is retrieved/stored here to avoid breaking unexpected dependencies.
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

/**
 * AUTH STORE — isInitialized lifecycle:
 * - Starts as false
 * - Set to true after loadFromStorage() completes (existing session restore)
 * - Set to true after login() completes (fresh login)
 * - Stays true after logout() (user is initialized, just unauthenticated)
 * AI TEST: isInitialized should ALWAYS become true within 2 seconds of app start.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isInitialized: false,

  login: async (user, accessToken, refreshToken) => {
    set({ isLoading: true });
    try {
      await SecureStore.setItemAsync('user', JSON.stringify(user));
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      set({ user, accessToken, isLoading: false, isInitialized: true });
    } catch (e) {
      console.error('Error storing auth info', e);
      set({ isLoading: false, isInitialized: true });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      disconnectSocket(); // Tear down socket before clearing auth
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ user: null, accessToken: null, isLoading: false, isInitialized: true });
    } catch (e) {
      console.error('Error during logout', e);
      set({ isLoading: false, isInitialized: true });
    }
  },

  loadFromStorage: async () => {
    set({ isLoading: true });
    try {
      const storedUser = await SecureStore.getItemAsync('user');
      const token = await SecureStore.getItemAsync('accessToken');
      if (storedUser && token) {
        try {
          const decoded: { exp: number } = jwtDecode(token);
          const isExpired = decoded.exp * 1000 < Date.now();
          if (!isExpired) {
            set({ user: JSON.parse(storedUser), accessToken: token });
          } else {
            // Token expired — check if refresh token exists to allow silent refresh
            const refreshToken = await SecureStore.getItemAsync('refreshToken');
            if (refreshToken) {
              // Set stale token; api.ts interceptor will handle refresh on first request
              set({ user: JSON.parse(storedUser), accessToken: token });
            }
            // If no refresh token, don't set user — forces clean login
          }
        } catch {
          // Can't decode token — treat as expired, don't restore session
        }
      }
    } catch (e) {
      console.error('Error loading auth from storage', e);
    } finally {
      set({ isInitialized: true, isLoading: false });
    }
  },
}));
