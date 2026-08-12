import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { RequestCard } from '../components/requests/RequestCard';
import { useRequestsStore } from '../stores/requests.store';
import type { RequestBucket } from '../stores/requests.store';
import { useUsersStore } from '../stores/users.store';
import * as assignmentApi from '../api/assignment.api';
import { Hall, RequestStatus, UserRole } from '../types/enums';
import { formatHall } from '../utils/formatters';
import { cn } from '../utils/cn';

const TABS: { key: RequestBucket; label: string }[] = [
  { key: 'waiting', label: 'Waiting' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

const HALL_FILTER_ALL = 'ALL';
const VOLUNTEER_FILTER_ALL = 'ALL';
const VOLUNTEER_FILTER_UNASSIGNED = 'UNASSIGNED';

export function LeaderRequestsPage() {
  const [tab, setTab] = useState<RequestBucket>('waiting');
  const [sweeping, setSweeping] = useState(false);
  const [hallFilter, setHallFilter] = useState<string>(HALL_FILTER_ALL);
  const [volunteerFilter, setVolunteerFilter] = useState<string>(VOLUNTEER_FILTER_ALL);
  const store = useRequestsStore();
  const volunteers = useUsersStore((s) => s.users.filter((u) => u.role === UserRole.VOLUNTEER));
  const fetchUsers = useUsersStore((s) => s.fetch);

  useEffect(() => {
    store.setActiveView(tab);
    if (tab === 'waiting') void store.fetchWaiting();
    else if (tab === 'active') void store.fetchActive();
    else if (tab === 'completed') void store.fetchCompleted();
    else void store.fetchAll();
    return () => store.setActiveView(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const bucketItems = store[tab];

  const items = useMemo(() => {
    return bucketItems.filter((request) => {
      if (hallFilter !== HALL_FILTER_ALL && request.hall !== hallFilter) return false;
      if (volunteerFilter === VOLUNTEER_FILTER_UNASSIGNED && request.volunteer) return false;
      if (
        volunteerFilter !== VOLUNTEER_FILTER_ALL &&
        volunteerFilter !== VOLUNTEER_FILTER_UNASSIGNED &&
        request.volunteer?.id !== volunteerFilter
      ) {
        return false;
      }
      return true;
    });
  }, [bucketItems, hallFilter, volunteerFilter]);

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

      <Card className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Hall</label>
            <Select
              className="w-auto"
              value={hallFilter}
              onChange={(e) => setHallFilter(e.target.value)}
            >
              <option value={HALL_FILTER_ALL}>All</option>
              {Object.values(Hall).map((h) => (
                <option key={h} value={h}>
                  {formatHall(h)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Volunteer</label>
            <Select
              className="w-auto"
              value={volunteerFilter}
              onChange={(e) => setVolunteerFilter(e.target.value)}
            >
              <option value={VOLUNTEER_FILTER_ALL}>All</option>
              <option value={VOLUNTEER_FILTER_UNASSIGNED}>Unassigned</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </div>
          <span className="text-xs text-slate-400 sm:ml-auto">
            {items.length} of {bucketItems.length} requests
          </span>
        </div>
      </Card>

      {store.loading && items.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={
            bucketItems.length === 0
              ? `No ${TABS.find((t) => t.key === tab)?.label.toLowerCase()} requests`
              : 'No requests match your filters'
          }
        />
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
