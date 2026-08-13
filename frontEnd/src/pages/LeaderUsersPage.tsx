import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { UsersTable } from '../components/users/UsersTable';
import { BulkCreateUsersModal } from '../components/users/BulkCreateUsersModal';
import { RevealCodesModal } from '../components/users/RevealCodesModal';
import { useUsersStore } from '../stores/users.store';
import { exportHallPdf } from '../api/users.api';
import { Gender, UserRole, VolunteerStatus } from '../types/enums';
import { getHallNumberGroup, HALL_NUMBER_GROUP_OPTIONS } from '../utils/formatters';

const HALL_FILTER_ALL = 'ALL';
const ROLE_FILTER_ALL = 'ALL';
const STATUS_FILTER_ALL = 'ALL';
const GENDER_FILTER_ALL = 'ALL';

export function LeaderUsersPage() {
  const users = useUsersStore((s) => s.users);
  const loading = useUsersStore((s) => s.loading);
  const fetch = useUsersStore((s) => s.fetch);
  const updateStatus = useUsersStore((s) => s.updateStatus);
  const updateCapacity = useUsersStore((s) => s.updateCapacity);
  const updateHall = useUsersStore((s) => s.updateHall);
  const removeUser = useUsersStore((s) => s.remove);
  const lastCreatedBatch = useUsersStore((s) => s.lastCreatedBatch);
  const clearLastCreatedBatch = useUsersStore((s) => s.clearLastCreatedBatch);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(ROLE_FILTER_ALL);
  const [hallFilter, setHallFilter] = useState<string>(HALL_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_FILTER_ALL);
  const [genderFilter, setGenderFilter] = useState<string>(GENDER_FILTER_ALL);
  const [modalOpen, setModalOpen] = useState(false);
  const [exportHall, setExportHall] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !u.name.toLowerCase().includes(q) && !u.code.toLowerCase().includes(q)) {
        return false;
      }
      if (roleFilter !== ROLE_FILTER_ALL && u.role !== roleFilter) return false;
      if (hallFilter !== HALL_FILTER_ALL && !getHallNumberGroup(Number(hallFilter)).includes(u.hall ?? -1)) {
        return false;
      }
      if (statusFilter !== STATUS_FILTER_ALL && u.status !== statusFilter) return false;
      if (genderFilter !== GENDER_FILTER_ALL && u.gender !== genderFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, hallFilter, statusFilter, genderFilter]);

  const handleStatusChange = async (id: string, status: VolunteerStatus) => {
    try {
      await updateStatus(id, status);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update status');
    }
  };

  const handleCapacityChange = async (id: string, capacity: number) => {
    try {
      await updateCapacity(id, capacity);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update capacity');
    }
  };

  const handleHallChange = async (id: string, hall: number) => {
    try {
      await updateHall(id, hall);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update hall');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? They will no longer be able to log in.`)) {
      return;
    }
    try {
      await removeUser(id);
      toast.success(`${name} deleted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete user');
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const blob = await exportHallPdf(exportHall);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hall-${exportHall}-users.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not export PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900">Users</h1>
        <Button onClick={() => setModalOpen(true)}>+ Add Users</Button>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder="Search name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-56"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Role</label>
            <Select
              className="w-auto"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value={ROLE_FILTER_ALL}>All</option>
              <option value={UserRole.VOLUNTEER}>Volunteer</option>
              <option value={UserRole.LEADER}>Leader</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Hall</label>
            <Select
              className="w-auto"
              value={hallFilter}
              onChange={(e) => setHallFilter(e.target.value)}
            >
              <option value={HALL_FILTER_ALL}>All</option>
              {HALL_NUMBER_GROUP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Status</label>
            <Select
              className="w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value={STATUS_FILTER_ALL}>All</option>
              <option value={VolunteerStatus.AVAILABLE}>Available</option>
              <option value={VolunteerStatus.BUSY}>Busy</option>
              <option value={VolunteerStatus.OFFLINE}>Offline</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Gender</label>
            <Select
              className="w-auto"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            >
              <option value={GENDER_FILTER_ALL}>All</option>
              <option value={Gender.MALE}>Male</option>
              <option value={Gender.FEMALE}>Female</option>
            </Select>
          </div>
          <span className="text-xs text-slate-400 sm:ml-auto">
            {filtered.length} of {users.length} users
          </span>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
          <label className="text-xs font-medium text-slate-500">Export codes PDF for</label>
          <Select
            className="w-auto"
            value={exportHall}
            onChange={(e) => setExportHall(Number(e.target.value))}
          >
            {HALL_NUMBER_GROUP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            size="sm"
            loading={exporting}
            onClick={() => void handleExportPdf()}
          >
            Export PDF
          </Button>
        </div>
      </Card>

      {loading && users.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No users match your filters" />
      ) : (
        <UsersTable
          users={filtered}
          onStatusChange={(id, status) => void handleStatusChange(id, status)}
          onCapacityChange={(id, capacity) => void handleCapacityChange(id, capacity)}
          onHallChange={(id, hall) => void handleHallChange(id, hall)}
          onDelete={(id) => {
            const user = filtered.find((u) => u.id === id);
            void handleDelete(id, user?.name ?? 'this user');
          }}
        />
      )}

      <BulkCreateUsersModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <RevealCodesModal users={lastCreatedBatch} onClose={clearLastCreatedBatch} />
    </div>
  );
}
