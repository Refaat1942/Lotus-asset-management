'use client';

import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_MAINTENANCE: 'bg-amber-100 text-amber-700',
  IN_REPAIR: 'bg-orange-100 text-orange-700',
  RETIRED: 'bg-slate-100 text-slate-600',
  LOST: 'bg-red-100 text-red-700',
  DISPOSED: 'bg-gray-100 text-gray-600',
};

const conditionColors: Record<string, string> = {
  EXCELLENT: 'bg-emerald-100 text-emerald-700',
  GOOD: 'bg-blue-100 text-blue-700',
  FAIR: 'bg-amber-100 text-amber-700',
  POOR: 'bg-orange-100 text-orange-700',
  DAMAGED: 'bg-red-100 text-red-700',
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useApp();
  const label = t(`statuses.${status}`) || status;
  return (
    <span className={cn('status-badge', statusColors[status] || 'bg-slate-100 text-slate-600')}>
      {label}
    </span>
  );
}

export function ConditionBadge({ condition }: { condition: string }) {
  const { t } = useApp();
  const label = t(`conditions.${condition}`) || condition;
  return (
    <span className={cn('status-badge', conditionColors[condition] || 'bg-slate-100 text-slate-600')}>
      {label}
    </span>
  );
}
