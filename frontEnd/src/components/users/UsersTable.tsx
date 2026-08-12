import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { VolunteerStatusBadge } from './VolunteerStatusBadge';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { UserDto } from '../../types/models';
import { UserRole, VolunteerStatus } from '../../types/enums';
import { timeAgo } from '../../utils/formatters';

interface UsersTableProps {
  users: UserDto[];
  onStatusChange: (id: string, status: VolunteerStatus) => void;
  onCapacityChange: (id: string, capacity: number) => void;
  onDelete: (id: string) => void;
}

export function UsersTable({
  users,
  onStatusChange,
  onCapacityChange,
  onDelete,
}: UsersTableProps) {
  const [capacityDrafts, setCapacityDrafts] = useState<Record<string, number>>({});

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Gender</th>
            <th className="px-4 py-3">Hall</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Capacity</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.code}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
              <td className="px-4 py-3">
                <Badge color={u.role === UserRole.LEADER ? 'indigo' : 'blue'}>{u.role}</Badge>
              </td>
              <td className="px-4 py-3 text-slate-600">{u.gender}</td>
              <td className="px-4 py-3 text-slate-600">{u.hall ?? '—'}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <VolunteerStatusBadge status={u.status} />
                  <Select
                    className="w-auto py-1 text-xs"
                    value={u.status}
                    onChange={(e) => onStatusChange(u.id, e.target.value as VolunteerStatus)}
                  >
                    <option value={VolunteerStatus.AVAILABLE}>Available</option>
                    <option value={VolunteerStatus.BUSY}>Busy</option>
                    <option value={VolunteerStatus.OFFLINE}>Offline</option>
                  </Select>
                </div>
              </td>
              <td className="px-4 py-3">
                {u.role === UserRole.VOLUNTEER ? (
                  <input
                    type="number"
                    min={0}
                    className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={capacityDrafts[u.id] ?? u.capacity}
                    onChange={(e) =>
                      setCapacityDrafts((prev) => ({ ...prev, [u.id]: Number(e.target.value) }))
                    }
                    onBlur={(e) => onCapacityChange(u.id, Number(e.target.value))}
                  />
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(u.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <Button variant="danger" size="sm" onClick={() => onDelete(u.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
