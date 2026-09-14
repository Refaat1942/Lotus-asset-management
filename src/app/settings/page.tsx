'use client';

import { useEffect, useState } from 'react';
import { Upload, Database, Key, User } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/contexts/AppContext';
import { PERMISSIONS } from '@/lib/permissions';
import { formatDateTime } from '@/lib/utils';
import { CompanyLogo } from '@/components/ui/CompanyLogo';

export default function SettingsPage() {
  const { t, locale, hasPermission, notify, setCompanyLogo, user, refreshUser } = useApp();
  const [settings, setSettings] = useState<{
    logo?: string | null;
    backupDir?: string;
    lastBackup?: string | null;
    backups?: string[];
  }>({});
  const [companyName, setCompanyName] = useState('');
  const [companyNameAr, setCompanyNameAr] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [usernameForm, setUsernameForm] = useState({ newUsername: '' });
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
      setSettings((prev) => ({ ...prev, logo: data.logo }));
      notify(t('savedSuccessfully'));
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data.error || t('error'), 'error');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify(t('error'), 'error');
      return;
    }
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
    });
    if (res.ok) {
      notify(t('passwordChanged'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      const data = await res.json();
      notify(data.error || t('error'), 'error');
    }
  };

  const handleChangeUsername = async () => {
    const res = await fetch('/api/auth/change-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newUsername: usernameForm.newUsername }),
    });
    if (res.ok) {
      notify(t('usernameChanged'));
      refreshUser();
    } else {
      const data = await res.json();
      notify(data.error || t('error'), 'error');
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
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-lotus-600" />
            <h3 className="font-semibold text-slate-900">{t('changePassword')}</h3>
          </div>
          <Input label={t('currentPassword')} type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
          <Input label={t('newPassword')} type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
          <Input label={t('confirmPassword')} type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
          <Button onClick={handleChangePassword}>{t('changePassword')}</Button>
        </div>

        {user?.canChangeUsername && (
          <div className="premium-card p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Key className="w-5 h-5 text-lotus-600" />
              <h3 className="font-semibold text-slate-900">{t('changeUsername')}</h3>
            </div>
            <Input label={t('username')} value={usernameForm.newUsername} onChange={(e) => setUsernameForm({ newUsername: e.target.value })} />
            <Button onClick={handleChangeUsername}>{t('changeUsername')}</Button>
          </div>
        )}

        {hasPermission(PERMISSIONS.MANAGE_SETTINGS) && (
          <>
            <div className="premium-card p-6 space-y-4">
              <h3 className="font-semibold text-slate-900">{t('companyLogo')}</h3>
              <div className="flex items-center gap-4">
                {typeof settings.logo === 'string' && settings.logo && <CompanyLogo src={settings.logo} size="lg" framed />}
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
          </>
        )}
      </div>
    </AppLayout>
  );
}
