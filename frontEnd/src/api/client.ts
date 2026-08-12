import axios from 'axios';
import type { ApiErrorPayload } from '../types/models';

// Reads/clears the same key Zustand's `persist` middleware uses for the auth
// store (see stores/auth.store.ts). Read directly from localStorage here
// rather than importing the store, to avoid a client.ts <-> auth.store.ts
// <-> auth.api.ts import cycle.
const AUTH_STORAGE_KEY = 'tcecpc-auth';

function readToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string } };
    return parsed.state?.token ?? null;
  } catch {
    return null;
  }
}

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

client.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    // Every backend response is wrapped as { success, statusCode, message,
    // data, timestamp, path }. Unwrap once here so every call site just
    // reads `.data` as the real payload type via the generic on client.get<T>.
    // Binary/blob responses (e.g. PDF export) aren't wrapped, so leave them as-is.
    if (response.config.responseType !== 'blob') {
      response.data = response.data?.data;
    }
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      const payload = error.response?.data as ApiErrorPayload | undefined;
      const message = Array.isArray(payload?.message)
        ? payload.message.join(', ')
        : (payload?.message ?? error.message);
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  },
);
