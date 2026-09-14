'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'green' | 'blue' | 'amber' | 'purple' | 'red';
}

const colorMap = {
  green: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  purple: 'bg-purple-50 text-purple-600',
  red: 'bg-red-50 text-red-600',
};

export function StatCard({ title, value, icon: Icon, trend, color = 'green' }: StatCardProps) {
  return (
    <div className="stat-card group min-w-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-medium text-slate-500 leading-snug">{title}</p>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight break-words">{value}</p>
      {trend && <p className="text-xs text-slate-400 mt-2">{trend}</p>}
    </div>
  );
}
