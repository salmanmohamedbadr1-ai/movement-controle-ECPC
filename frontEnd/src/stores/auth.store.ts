import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../api/auth.api';
import type { UserDto } from '../types/models';
import { useSocketStore } from './socket.store';

interface AuthState {
  token: string | null;
  user: UserDto | null;
  loading: boolean;
  error: string | null;
  login: (code: string) => Promise<void>;
  logout: () => void;
  setUser: (user: UserDto) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      loading: false,
      error: null,
      login: async (code: string) => {
        set({ loading: true, error: null });
        try {
          const res = await authApi.login(code);
          set({
            token: res.accessToken,
            user: res.user,
            loading: false,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed';
          set({ loading: false, error: message });
          throw err;
        }
      },
      logout: () => {
        useSocketStore.getState().disconnect();
        set({ token: null, user: null });
      },
      setUser: (user) => set({ user }),
    }),
    {
      name: 'tcecpc-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
