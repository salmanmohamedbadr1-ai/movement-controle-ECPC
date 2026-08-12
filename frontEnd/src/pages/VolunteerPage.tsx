import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { RequestCard } from '../components/requests/RequestCard';
import { VolunteerStatusBadge } from '../components/users/VolunteerStatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useRequestsStore } from '../stores/requests.store';
import * as usersApi from '../api/users.api';
import { RequestStatus, VolunteerStatus } from '../types/enums';
import { cn } from '../utils/cn';

const STATUS_OPTIONS: VolunteerStatus[] = [
  VolunteerStatus.AVAILABLE,
  VolunteerStatus.BUSY,
  VolunteerStatus.OFFLINE,
];

export function VolunteerPage() {
  const { user, setUser } = useAuth();
  const myActive = useRequestsStore((s) => s.myActive);
  const loading = useRequestsStore((s) => s.loading);
  const setActiveView = useRequestsStore((s) => s.setActiveView);
  const fetchMyActive = useRequestsStore((s) => s.fetchMyActive);
  const pickup = useRequestsStore((s) => s.pickup);
  const complete = useRequestsStore((s) => s.complete);

  useEffect(() => {
    setActiveView('myActive');
    void fetchMyActive();
    return () => setActiveView(null);
  }, [setActiveView, fetchMyActive]);

  if (!user) return null;

  const handleStatusChange = async (status: VolunteerStatus) => {
    if (status === user.status) return;
    try {
      const updated = await usersApi.updateUserStatus(user.id, status);
      setUser(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update status');
    }
  };

  const handleAction = async (id: string, status: RequestStatus) => {
    try {
      if (status === RequestStatus.ASSIGNED) await pickup(id);
      else if (status === RequestStatus.PICKED_UP) await complete(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="text-sm text-slate-500">Welcome back</p>
          <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
          <p className="mt-1 font-mono text-xs text-slate-400">{user.code}</p>
        </div>
        <div className="flex flex-col items-center gap-2 sm:items-end">
          <VolunteerStatusBadge status={user.status} />
          <div className="inline-flex rounded-lg border border-slate-200 p-1">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => void handleStatusChange(status)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  user.status === status
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100',
                )}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">My Active Requests</h2>
        {loading ? (
          <Spinner />
        ) : myActive.length === 0 ? (
          <EmptyState
            title="No active requests"
            description="You'll see a card here as soon as one is assigned to you."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myActive.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                actions={
                  request.status === RequestStatus.ASSIGNED ? (
                    <Button size="sm" onClick={() => void handleAction(request.id, request.status)}>
                      Pick Up
                    </Button>
                  ) : request.status === RequestStatus.PICKED_UP ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleAction(request.id, request.status)}
                    >
                      Complete
                    </Button>
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
