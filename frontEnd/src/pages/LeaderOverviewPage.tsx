import { useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { useDashboardStore } from '../stores/dashboard.store';
import { formatHall, getHallGroup } from '../utils/formatters';
import type { Hall } from '../types/enums';

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    </Card>
  );
}

export function LeaderOverviewPage() {
  const overview = useDashboardStore((s) => s.overview);
  const loading = useDashboardStore((s) => s.loading);
  const fetch = useDashboardStore((s) => s.fetch);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  if (loading && !overview) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (!overview) return null;

  const groupedPerHall = overview.perHall.reduce<
    { hall: Hall; waitingCount: number; activeCount: number }[]
  >((groups, h) => {
    const representative = getHallGroup(h.hall)[0];
    const existing = groups.find((g) => g.hall === representative);
    if (existing) {
      existing.waitingCount += h.waitingCount;
      existing.activeCount += h.activeCount;
    } else {
      groups.push({ hall: representative, waitingCount: h.waitingCount, activeCount: h.activeCount });
    }
    return groups;
  }, []);

  const maxHallCount = Math.max(1, ...groupedPerHall.map((h) => h.waitingCount + h.activeCount));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-xl font-bold text-slate-900">Requests</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Waiting" value={overview.requests.waiting} color="text-amber-600" />
          <StatCard label="Assigned" value={overview.requests.assigned} color="text-blue-600" />
          <StatCard label="Picked Up" value={overview.requests.pickedUp} color="text-indigo-600" />
          <StatCard label="Completed" value={overview.requests.completed} color="text-emerald-600" />
          <StatCard label="Cancelled" value={overview.requests.cancelled} color="text-slate-500" />
          <StatCard label="Total" value={overview.requests.total} color="text-slate-900" />
        </div>
      </div>

      <div>
        <h1 className="mb-4 text-xl font-bold text-slate-900">Volunteers</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Available" value={overview.volunteers.available} color="text-emerald-600" />
          <StatCard label="Busy" value={overview.volunteers.busy} color="text-amber-600" />
          <StatCard label="Offline" value={overview.volunteers.offline} color="text-slate-500" />
          <StatCard label="Total" value={overview.volunteers.total} color="text-slate-900" />
        </div>
      </div>

      <div>
        <h1 className="mb-4 text-xl font-bold text-slate-900">Load by Hall</h1>
        <Card className="space-y-4">
          {groupedPerHall.map((h) => (
            <div key={h.hall}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{formatHall(h.hall)}</span>
                <span className="text-slate-400">
                  {h.waitingCount} waiting · {h.activeCount} active
                </span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="bg-amber-400"
                  style={{ width: `${(h.waitingCount / maxHallCount) * 100}%` }}
                />
                <div
                  className="bg-blue-400"
                  style={{ width: `${(h.activeCount / maxHallCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
