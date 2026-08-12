import { Badge } from '../ui/Badge';
import type { BadgeColor } from '../ui/Badge';
import { RequestStatus } from '../../types/enums';

const config: Record<RequestStatus, { label: string; color: BadgeColor }> = {
  [RequestStatus.WAITING]: { label: 'Waiting', color: 'amber' },
  [RequestStatus.ASSIGNED]: { label: 'Assigned', color: 'blue' },
  [RequestStatus.PICKED_UP]: { label: 'Picked Up', color: 'indigo' },
  [RequestStatus.COMPLETED]: { label: 'Completed', color: 'emerald' },
  [RequestStatus.CANCELLED]: { label: 'Cancelled', color: 'slate' },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { label, color } = config[status];
  return <Badge color={color}>{label}</Badge>;
}
