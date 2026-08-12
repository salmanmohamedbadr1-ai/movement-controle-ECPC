import { useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useUsersStore } from '../../stores/users.store';
import { Gender, UserRole } from '../../types/enums';

const HALL_NUMBERS = [1, 2, 3, 4];

interface NameRow {
  name: string;
  gender: Gender;
}

export function BulkCreateUsersModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createBulk = useUsersStore((s) => s.createBulk);
  const [role, setRole] = useState<UserRole>(UserRole.VOLUNTEER);
  const [hall, setHall] = useState(1);
  const [rows, setRows] = useState<NameRow[]>([{ name: '', gender: Gender.MALE }]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRole(UserRole.VOLUNTEER);
    setHall(1);
    setRows([{ name: '', gender: Gender.MALE }]);
  };

  const trimmedRows = rows
    .map((r) => ({ name: r.name.trim(), gender: r.gender }))
    .filter((r) => r.name.length > 0);
  const canSubmit = trimmedRows.length > 0 && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createBulk({
        role,
        hall,
        users: trimmedRows,
      });
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create users');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Users">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value={UserRole.VOLUNTEER}>Volunteer</option>
              <option value={UserRole.LEADER}>Leader</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Hall</label>
            <Select value={hall} onChange={(e) => setHall(Number(e.target.value))}>
              {HALL_NUMBERS.map((h) => (
                <option key={h} value={h}>
                  Hall {h}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Names</label>
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <Input
                autoFocus={i === 0}
                placeholder="Jane Doe"
                value={row.name}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)),
                  )
                }
              />
              <Select
                className="w-auto"
                value={row.gender}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r, idx) =>
                      idx === i ? { ...r, gender: e.target.value as Gender } : r,
                    ),
                  )
                }
              >
                <option value={Gender.MALE}>Male</option>
                <option value={Gender.FEMALE}>Female</option>
              </Select>
              {rows.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setRows((prev) => [...prev, { name: '', gender: Gender.MALE }])}
          >
            + Add another
          </Button>
        </div>

        <Button type="submit" className="w-full" loading={submitting} disabled={!canSubmit}>
          Create {trimmedRows.length > 1 ? `${trimmedRows.length} users` : 'user'}
        </Button>
      </form>
    </Modal>
  );
}
