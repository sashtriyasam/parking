import apiClient from './api';
import type { AuthResponse, LoginCredentials, RegisterData, User } from '../types';

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<{ status: string; data: { user: User } }>('/auth/me');
        return response.data.data.user;
    },

    logout(): void {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },
};
