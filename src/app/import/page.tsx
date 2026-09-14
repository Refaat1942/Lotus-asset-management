'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { useApp } from '@/contexts/AppContext';
import { PERMISSIONS } from '@/lib/permissions';

interface ColumnMapping { excelColumn: string; systemField: string; }

const SYSTEM_FIELDS = [
  'assetCode', 'name', 'nameAr', 'category', 'serialNumber', 'model', 'manufacturer',
  'department', 'branch', 'status', 'condition', 'purchaseDate', 'purchasePrice',
  'currentValue', 'depreciationRate', 'notes', 'assignee', 'employeeId',
];

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  successes: { row: number; assetCode: string; name: string }[];
  failures: { row: number; reason: string }[];
}

export default function ImportPage() {
  const { t, hasPermission, notify } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [step, setStep] = useState<'upload' | 'mapping' | 'results'>('upload');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isLotusTemplate, setIsLotusTemplate] = useState(false);
  const [importMode, setImportMode] = useState<'create' | 'update' | 'upsert'>('upsert');

  if (!hasPermission(PERMISSIONS.IMPORT_EXCEL)) {
    return <AppLayout><p className="text-center text-slate-500 py-16">{t('noPermission')}</p></AppLayout>;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', selected);

    try {
      const res = await fetch('/api/import/detect', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setHeaders(data.headers);
        setMappings(data.mappings);
        setPreview(data.preview);
        setTotalRows(data.totalRows);
        setIsLotusTemplate(data.isLotusTemplate || false);
        setStep('mapping');
      } else {
        notify(data.error || t('error'), 'error');
      }
    } catch {
      notify(t('error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateMapping = (excelColumn: string, systemField: string) => {
    setMappings((prev) => {
      const filtered = prev.filter((m) => m.excelColumn !== excelColumn);
      if (!systemField) return filtered;
      if (systemField === 'notes') {
        return [...filtered, { excelColumn, systemField }];
      }
      return [...filtered.filter((m) => m.systemField !== systemField), { excelColumn, systemField }];
    });
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mappings', JSON.stringify(mappings));
    formData.append('mode', importMode);

    try {
      const res = await fetch('/api/import/execute', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setStep('results');
        notify(t('importedSuccessfully'));
      } else {
        notify(data.error || t('error'), 'error');
      }
    } catch {
      notify(t('error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">{t('import')}</h1>
          <p className="page-subtitle">{t('selectFile')}</p>
        </div>

        {step === 'upload' && (
          <div className="premium-card p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-lotus-50 flex items-center justify-center mx-auto mb-6">
              <FileSpreadsheet className="w-10 h-10 text-lotus-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('selectFile')}</h3>
            <p className="text-sm text-slate-500 mb-6">Lotus-Items.xlsx or compatible Excel file</p>
            <label className="btn-primary cursor-pointer inline-flex">
              <Upload className="w-4 h-4" />
              {t('selectFile')}
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
            </label>
            {loading && <p className="text-sm text-slate-400 mt-4">{t('loading')}</p>}
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6">
            {isLotusTemplate && (
              <div className="premium-card p-4 bg-lotus-50 border-lotus-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-lotus-800 font-medium">{t('lotusTemplateDetected')}</p>
                  <p className="text-xs text-lotus-600 mt-1">{t('lotusTemplateHint')}</p>
                  <p className="text-xs text-lotus-700 mt-2">{headers.length} columns detected, {mappings.length} mapped automatically</p>
                </div>
                <Button onClick={handleImport} loading={loading}>
                  {t('startImport')} ({totalRows} rows)
                </Button>
              </div>
            )}

            <div className="premium-card p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="font-semibold text-slate-900">{t('columnMapping')}</h3>
                <div className="flex items-center gap-4">
                  <Select
                    label=""
                    options={[
                      { value: 'upsert', label: t('importModeUpsert') },
                      { value: 'create', label: t('importModeCreate') },
                      { value: 'update', label: t('importModeUpdate') },
                    ]}
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as 'create' | 'update' | 'upsert')}
                    className="w-48"
                  />
                  <span className="text-sm text-slate-500">{totalRows} rows</span>
                </div>
              </div>
              <div className="space-y-3">
                {headers.map((header) => {
                  const current = mappings.find((m) => m.excelColumn === header);
                  return (
                    <div key={header} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm font-medium text-slate-700 w-1/3">{header}</span>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                      <Select
                        options={[
                          { value: '', label: '- Skip -' },
                          ...SYSTEM_FIELDS.map((f) => ({ value: f, label: f })),
                        ]}
                        value={current?.systemField || ''}
                        onChange={(e) => updateMapping(header, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {preview.length > 0 && (
              <div className="premium-card p-6 overflow-x-auto">
                <h3 className="font-semibold text-slate-900 mb-4">Preview (first 5 rows)</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {headers.map((h) => <th key={h} className="table-header">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        {headers.map((h) => <td key={h} className="table-cell">{String(row[h] || '')}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setStep('upload')}>{t('cancel')}</Button>
              <Button onClick={handleImport} loading={loading}>{t('startImport')}</Button>
            </div>
          </div>
        )}

        {step === 'results' && result && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-5">
              <div className="stat-card"><p className="text-sm text-slate-500">{t('totalAssets')}</p><p className="text-3xl font-bold">{result.total}</p></div>
              <div className="stat-card"><p className="text-sm text-slate-500">{t('successfulRecords')}</p><p className="text-3xl font-bold text-emerald-600">{result.success}</p></div>
              <div className="stat-card"><p className="text-sm text-slate-500">{t('failedRecords')}</p><p className="text-3xl font-bold text-red-600">{result.failed}</p></div>
            </div>

            {result.failures.length > 0 && (
              <div className="premium-card p-6">
                <h3 className="font-semibold text-red-600 mb-4 flex items-center gap-2"><XCircle className="w-5 h-5" /> {t('failedRecords')}</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.failures.map((f) => (
                    <div key={f.row} className="flex items-center gap-3 text-sm p-2 bg-red-50 rounded-lg">
                      <span className="font-mono text-red-500">Row {f.row}</span>
                      <span className="text-red-700">{f.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.successes.length > 0 && (
              <div className="premium-card p-6">
                <h3 className="font-semibold text-emerald-600 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {t('successfulRecords')}</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.successes.slice(0, 50).map((s) => (
                    <div key={s.row} className="flex items-center gap-3 text-sm p-2 bg-emerald-50 rounded-lg">
                      <span className="font-mono text-emerald-600">{s.assetCode}</span>
                      <span className="text-emerald-800">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              {result.success > 0 && (
                <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
                  {t('viewDashboard')}
                </Link>
              )}
              <Button variant="secondary" onClick={() => { setStep('upload'); setFile(null); setResult(null); }}>{t('importAction')}</Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
