'use client';

import { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { useApp } from '@/contexts/AppContext';
import { PERMISSIONS } from '@/lib/permissions';

const REPORT_TYPES = [
  { value: 'assets', label: 'assetsReport' },
  { value: 'assignments', label: 'assignmentsReport' },
  { value: 'transfers', label: 'transfersReport' },
  { value: 'history', label: 'reportHistory' },
  { value: 'depreciation', label: 'depreciationReport' },
];

export default function ReportsPage() {
  const { t, hasPermission, notify } = useApp();
  const [reportType, setReportType] = useState('assets');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  if (!hasPermission(PERMISSIONS.VIEW_REPORTS)) {
    return <AppLayout><p className="text-center text-slate-500 py-16">{t('noPermission')}</p></AppLayout>;
  }

  const generateReport = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: reportType });
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);

    try {
      const res = await fetch(`/api/reports?${params}`);
      const result = await res.json();
      if (res.ok) {
        setData(result.data || []);
        setGenerated(true);
      } else {
        notify(t('error'), 'error');
      }
    } catch {
      notify(t('error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    const params = new URLSearchParams({ type: reportType, export: 'true' });
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);

    const res = await fetch(`/api/reports?${params}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      notify(t('exportedSuccessfully'));
    }
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">{t('reports')}</h1>
          <p className="page-subtitle">{t('generate')}</p>
        </div>

        <div className="premium-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <Select
              label={t('reportType')}
              options={REPORT_TYPES.map((r) => ({ value: r.value, label: t(r.label) }))}
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            />
            <Input label={t('fromDate')} type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input label={t('toDate')} type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={generateReport} loading={loading} className="flex-1">
                <BarChart3 className="w-4 h-4" /> {t('generate')}
              </Button>
              {generated && hasPermission(PERMISSIONS.EXPORT_EXCEL) && (
                <Button variant="secondary" onClick={exportExcel}>
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {generated && (
          <div className="premium-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-lotus-600" />
                <span className="font-medium text-slate-900">{data.length} {t('results')}</span>
              </div>
            </div>
            {data.length === 0 ? (
              <p className="text-center text-slate-400 py-12">{t('noData')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {columns.map((col) => <th key={col} className="table-header">{col}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.slice(0, 100).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        {columns.map((col) => (
                          <td key={col} className="table-cell">{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
