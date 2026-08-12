import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../stores/auth.store';
import { UserRole } from '../types/enums';

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to={user.role === UserRole.LEADER ? '/leader' : '/volunteer'} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      await login(code.trim().toUpperCase());
      const freshUser = useAuthStore.getState().user;
      navigate(freshUser?.role === UserRole.LEADER ? '/leader' : '/volunteer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Volunteer / Leader Login</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the login code you were given.</p>
      </div>

      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Login code</label>
            <Input
              autoFocus
              placeholder="VOL-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono tracking-wider"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={!code.trim()}>
            Log in
          </Button>
        </form>
      </Card>
    </div>
  );
}
