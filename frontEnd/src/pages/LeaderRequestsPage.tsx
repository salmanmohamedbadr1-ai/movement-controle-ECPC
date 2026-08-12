import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { RequestCard } from '../components/requests/RequestCard';
import { useRequestsStore } from '../stores/requests.store';
import type { RequestBucket } from '../stores/requests.store';
import * as assignmentApi from '../api/assignment.api';
import { RequestStatus } from '../types/enums';
import { cn } from '../utils/cn';

const TABS: { key: RequestBucket; label: string }[] = [
  { key: 'waiting', label: 'Waiting' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

export function LeaderRequestsPage() {
  const [tab, setTab] = useState<RequestBucket>('waiting');
  const [sweeping, setSweeping] = useState(false);
  const store = useRequestsStore();

  useEffect(() => {
    store.setActiveView(tab);
    if (tab === 'waiting') void store.fetchWaiting();
    else if (tab === 'active') void store.fetchActive();
    else if (tab === 'completed') void store.fetchCompleted();
    else void store.fetchAll();
    return () => store.setActiveView(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const items = store[tab];

  const handleCancel = async (id: string) => {
    try {
      await store.cancel(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel request');
    }
  };

  const handleReassign = async (id: string) => {
    try {
      await assignmentApi.reassignRequest(id);
      store.refreshCurrent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not reassign request');
    }
  };

  const handleSweep = async () => {
    setSweeping(true);
    try {
      const results = await assignmentApi.runAssignment();
      const assigned = results.filter((r) => r.assigned).length;
      toast.success(`${assigned} assigned, ${results.length - assigned} still waiting`);
      store.refreshCurrent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sweep failed');
    } finally {
      setSweeping(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900">Requests</h1>
        <Button variant="secondary" loading={sweeping} onClick={() => void handleSweep()}>
          Run Assignment Sweep
        </Button>
      </div>

      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors',
              tab === t.key ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {store.loading && items.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={`No ${TABS.find((t) => t.key === tab)?.label.toLowerCase()} requests`} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              actions={
                <>
                  {(request.status === RequestStatus.WAITING ||
                    request.status === RequestStatus.ASSIGNED) && (
                    <Button size="sm" variant="danger" onClick={() => void handleCancel(request.id)}>
                      Cancel
                    </Button>
                  )}
                  {request.status === RequestStatus.ASSIGNED && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleReassign(request.id)}
                    >
                      Reassign
                    </Button>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
