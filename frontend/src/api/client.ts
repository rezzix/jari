import axios from 'axios';
import type { ApiResponse, PaginatedResponse } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let sessionExpiredFlag = false;

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!sessionExpiredFlag) {
        sessionExpiredFlag = true;
        useAuthStore.getState().sessionExpired();
      }
      // Return a never-resolving promise so calling code doesn't show error state
      // before AuthGuard redirects to login
      return new Promise(() => {});
    }
    sessionExpiredFlag = false;
    return Promise.reject(error);
  },
);

// Reset the flag when user logs in successfully
const originalLogin = useAuthStore.getState().login;
useAuthStore.setState({
  login: async (username: string, password: string) => {
    sessionExpiredFlag = false;
    return originalLogin(username, password);
  },
});

export async function apiGet<T>(url: string): Promise<T> {
  const res = await client.get<ApiResponse<T>>(url);
  return res.data.data;
}

export async function apiGetPaginated<T>(url: string, params?: Record<string, string | number>): Promise<PaginatedResponse<T>> {
  const res = await client.get<PaginatedResponse<T>>(url, { params });
  return res.data;
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const res = await client.post<ApiResponse<T>>(url, data);
  return res.data.data;
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const res = await client.put<ApiResponse<T>>(url, data);
  return res.data.data;
}

export async function apiDelete(url: string): Promise<void> {
  await client.delete(url);
}

export default client;