import { useAuthStore } from '../stores/auth.store';

export function useAuth() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  return {
    token,
    user,
    loading,
    error,
    login,
    logout,
    setUser,
    isAuthenticated: Boolean(token && user),
  };
}
