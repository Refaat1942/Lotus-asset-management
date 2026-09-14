'use client';

import { useEffect, useState } from 'react';
import { Plus, MapPin, Pencil, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/contexts/AppContext';
import { PERMISSIONS } from '@/lib/permissions';

interface Branch {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  address?: string;
  isActive: boolean;
  _count?: { assets: number };
}

export default function BranchesPage() {
  const { t, locale, hasPermission, notify } = useApp();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState({ name: '', nameAr: '', code: '', address: '' });

  const fetchData = () => {
    fetch('/api/branches').then((r) => r.json()).then(setBranches).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (!hasPermission(PERMISSIONS.MANAGE_BRANCHES)) {
    return <AppLayout><p className="text-center text-slate-500 py-16">{t('noPermission')}</p></AppLayout>;
  }

  const openCreate = () => { setEditing(null); setForm({ name: '', nameAr: '', code: '', address: '' }); setShowModal(true); };
  const openEdit = (b: Branch) => { setEditing(b); setForm({ name: b.name, nameAr: b.nameAr || '', code: b.code || '', address: b.address || '' }); setShowModal(true); };

  const handleSave = async () => {
    const url = editing ? `/api/branches/${editing.id}` : '/api/branches';
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { notify(t('savedSuccessfully')); setShowModal(false); fetchData(); }
    else notify(t('error'), 'error');
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
    if (res.ok) { notify(t('deletedSuccessfully')); fetchData(); }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{t('branches')}</h1>
            <p className="page-subtitle">{t('manageBranches')}</p>
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4" /> {t('addNew')}</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-lotus-500 border-t-transparent rounded-full" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches.map((branch) => (
              <div key={branch.id} className="premium-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(branch)} className="p-2 hover:bg-slate-100 rounded-lg"><Pencil className="w-4 h-4 text-slate-400" /></button>
                    <button onClick={() => handleDelete(branch.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900">{locale === 'ar' && branch.nameAr ? branch.nameAr : branch.name}</h3>
                {branch.code && <p className="text-xs text-slate-400 font-mono mt-1">{branch.code}</p>}
                {branch.address && <p className="text-sm text-slate-500 mt-2">{branch.address}</p>}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-sm text-slate-500">{branch._count?.assets || 0} {t('assets')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? t('edit') : t('create')}>
        <div className="space-y-4">
          <Input label={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t('name') + ' (AR)'} value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          <Input label={t('code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Textarea label={t('address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave}>{t('save')}</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
