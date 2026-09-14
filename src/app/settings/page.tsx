'use client';

import { useEffect, useState } from 'react';
import { Upload, Database } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/contexts/AppContext';
import { formatDateTime } from '@/lib/utils';

export default function SettingsPage() {
  const { t, locale, notify, setCompanyLogo } = useApp();
  const [settings, setSettings] = useState<{
    logo?: string | null;
    backupDir?: string;
    lastBackup?: string | null;
    backups?: string[];
  }>({});
  const [companyName, setCompanyName] = useState('');
  const [companyNameAr, setCompanyNameAr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setCompanyName(data.companyName || '');
        setCompanyNameAr(data.companyNameAr || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSaveSettings = async () => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, companyNameAr }),
    });
    if (res.ok) notify(t('savedSuccessfully'));
    else notify(t('error'), 'error');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    const res = await fetch('/api/settings', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      setCompanyLogo(data.logo);
      notify(t('savedSuccessfully'));
    }
  };

  const handleBackup = async () => {
    const res = await fetch('/api/backup', { method: 'POST' });
    if (res.ok) notify(t('savedSuccessfully'));
    else notify(t('error'), 'error');
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="page-title">{t('settings')}</h1>
          <p className="page-subtitle">{t('systemSettings')}</p>
        </div>

        <div className="premium-card p-6 space-y-4">
              <h3 className="font-semibold text-slate-900">{t('companyLogo')}</h3>
              <div className="flex items-center gap-4">
                {typeof settings.logo === 'string' && settings.logo && <img src={settings.logo} alt="Logo" className="w-16 h-16 rounded-xl object-contain border" />}
                <label className="btn-secondary cursor-pointer">
                  <Upload className="w-4 h-4" /> {t('uploadLogo')}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
              <Input label={t('name')} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              <Input label={t('name') + ' (AR)'} value={companyNameAr} onChange={(e) => setCompanyNameAr(e.target.value)} />
              <Button onClick={handleSaveSettings}>{t('save')}</Button>
            </div>

            <div className="premium-card p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-lotus-600" />
                <h3 className="font-semibold text-slate-900">{t('backupSettings')}</h3>
              </div>
              <div className="text-sm space-y-2">
                <p><span className="text-slate-500">{t('backupLocation')}:</span> <span className="font-mono text-slate-700">{settings.backupDir as string}</span></p>
                <p><span className="text-slate-500">{t('lastBackup')}:</span> <span className="text-slate-700">{settings.lastBackup ? formatDateTime(settings.lastBackup as string, locale) : '-'}</span></p>
                {(settings.backups as string[])?.length > 0 && (
                  <p><span className="text-slate-500">Backups:</span> <span className="text-slate-700">{(settings.backups as string[]).length} files</span></p>
                )}
              </div>
              <Button onClick={handleBackup}>{t('backupSettings')}</Button>
            </div>
      </div>
    </AppLayout>
  );
}
