import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type BadgeColor = 'amber' | 'blue' | 'indigo' | 'emerald' | 'slate' | 'rose';

const colorClasses: Record<BadgeColor, string> = {
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  slate: 'bg-slate-100 text-slate-700',
  rose: 'bg-rose-100 text-rose-800',
};

export function Badge({ color, children }: { color: BadgeColor; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        colorClasses[color],
      )}
    >
      {children}
    </span>
  );
}
