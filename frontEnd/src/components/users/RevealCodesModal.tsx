import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { UserDto } from '../../types/models';

export function RevealCodesModal({ users, onClose }: { users: UserDto[] | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    if (!users) return;
    try {
      await navigator.clipboard.writeText(users.map((u) => `${u.name} — ${u.code}`).join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  return (
    <Modal open={Boolean(users?.length)} onClose={onClose} title="Users created">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Save these login codes now — they won't be shown again anywhere in the app.
        </p>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {users?.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3"
            >
              <span className="text-sm font-medium text-slate-700">{u.name}</span>
              <span className="font-mono text-lg font-bold tracking-widest text-slate-900">
                {u.code}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => void handleCopyAll()}>
            {copied ? 'Copied ✓' : 'Copy all'}
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
