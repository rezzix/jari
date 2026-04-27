import { create } from 'zustand';
import type { UserDto } from '@/types';
import * as authApi from '@/api/auth';

interface AuthState {
  user: UserDto | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: Partial<UserDto>) => void;
  sessionExpired: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.login({ username, password });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  checkSession: async () => {
    // Only show loading spinner on initial check, not on re-validation
    const wasAuthenticated = get().isAuthenticated;
    if (!wasAuthenticated) set({ isLoading: true });
    try {
      const user = await authApi.me();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  sessionExpired: () => set({ user: null, isAuthenticated: false, isLoading: false }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));