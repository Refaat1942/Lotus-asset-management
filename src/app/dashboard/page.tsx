'use client';

import { useEffect, useState } from 'react';
import { Package, UserCheck, UserX, DollarSign, TrendingDown, Building2, MapPin } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/utils';

interface DashboardData {
  totalAssets: number;
  assignedAssets: number;
  unassignedAssets: number;
  totalValue: number;
  totalDepreciation: number;
  byDepartment: { name: string; nameAr: string; count: number }[];
  byBranch: { name: string; nameAr: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export default function DashboardPage() {
  const { t, locale } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-lotus-500 border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="page-title">{t('dashboard')}</h1>
          <p className="page-subtitle">{t('quickStats')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          <StatCard title={t('totalAssets')} value={data?.totalAssets || 0} icon={Package} color="green" />
          <StatCard title={t('assignedAssets')} value={data?.assignedAssets || 0} icon={UserCheck} color="blue" />
          <StatCard title={t('unassignedAssets')} value={data?.unassignedAssets || 0} icon={UserX} color="amber" />
          <StatCard title={t('totalValue')} value={formatCurrency(data?.totalValue, locale)} icon={DollarSign} color="purple" />
          <StatCard title={t('totalDepreciation')} value={formatCurrency(data?.totalDepreciation, locale)} icon={TrendingDown} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="premium-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-lotus-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-lotus-600" />
              </div>
              <h3 className="font-semibold text-slate-900">{t('assetsByDepartment')}</h3>
            </div>
            <div className="space-y-3">
              {data?.byDepartment.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{locale === 'ar' ? d.nameAr : d.name}</span>
                  <span className="text-sm font-semibold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">{d.count}</span>
                </div>
              ))}
              {(!data?.byDepartment || data.byDepartment.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-4">{t('noData')}</p>
              )}
            </div>
          </div>

          <div className="premium-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900">{t('assetsByBranch')}</h3>
            </div>
            <div className="space-y-3">
              {data?.byBranch.map((b) => (
                <div key={b.name} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{locale === 'ar' ? b.nameAr : b.name}</span>
                  <span className="text-sm font-semibold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">{b.count}</span>
                </div>
              ))}
              {(!data?.byBranch || data.byBranch.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-4">{t('noData')}</p>
              )}
            </div>
          </div>

          <div className="premium-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-900">{t('assetsByStatus')}</h3>
            </div>
            <div className="space-y-3">
              {data?.byStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{t(`statuses.${s.status}`)}</span>
                  <span className="text-sm font-semibold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">{s.count}</span>
                </div>
              ))}
              {(!data?.byStatus || data.byStatus.length === 0) && (
                <p className="text-sm text-slate-400 text-center py-4">{t('noData')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
