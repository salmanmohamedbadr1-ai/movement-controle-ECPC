import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
