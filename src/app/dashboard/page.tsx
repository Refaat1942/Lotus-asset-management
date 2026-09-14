'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Package, UserCheck, UserX, DollarSign, TrendingDown, Building2, MapPin, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/utils';

interface DashboardData {
  totalAssets: number;
  assignedAssets: number;
  unassignedAssets: number;
  totalValue: number;
  totalDepreciation: number;
  byDepartment: { id?: string | null; name: string; nameAr: string; count: number }[];
  byBranch: { id?: string | null; name: string; nameAr: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export default function DashboardPage() {
  const { t, locale } = useApp();
  const pathname = usePathname();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) {
        setData(null);
        setError(t('error'));
        return;
      }
      setData(await res.json());
    } catch {
      setData(null);
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (pathname === '/dashboard') {
      loadDashboard();
    }
  }, [pathname, loadDashboard]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && pathname === '/dashboard') {
        loadDashboard();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [pathname, loadDashboard]);

  if (loading && !data) {
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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-title">{t('dashboard')}</h1>
            <p className="page-subtitle">{t('quickStats')}</p>
          </div>
          <Button variant="secondary" onClick={loadDashboard} loading={loading}>
            <RefreshCw className="w-4 h-4" />
            {t('refresh')}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

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
              {(data?.byDepartment ?? []).map((d) => (
                <div key={d.id || d.name} className="flex items-center justify-between">
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
              {(data?.byBranch ?? []).map((b) => (
                <div key={b.id || b.name} className="flex items-center justify-between">
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
              {(data?.byStatus ?? []).map((s) => (
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
