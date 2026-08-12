import { Badge } from '../ui/Badge';
import type { BadgeColor } from '../ui/Badge';
import { VolunteerStatus } from '../../types/enums';

const config: Record<VolunteerStatus, { label: string; color: BadgeColor }> = {
  [VolunteerStatus.AVAILABLE]: { label: 'Available', color: 'emerald' },
  [VolunteerStatus.BUSY]: { label: 'Busy', color: 'amber' },
  [VolunteerStatus.OFFLINE]: { label: 'Offline', color: 'slate' },
};

export function VolunteerStatusBadge({ status }: { status: VolunteerStatus }) {
  const { label, color } = config[status];
  return <Badge color={color}>{label}</Badge>;
}
