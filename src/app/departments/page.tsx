'use client';

import { useEffect, useState } from 'react';
import { Plus, Building2, Pencil, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/contexts/AppContext';
import { PERMISSIONS } from '@/lib/permissions';

interface Department {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  description?: string;
  isActive: boolean;
  _count?: { assets: number };
}

export default function DepartmentsPage() {
  const { t, locale, hasPermission, notify } = useApp();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: '', nameAr: '', code: '', description: '' });

  const fetchData = () => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then(setDepartments)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (!hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS)) {
    return (
      <AppLayout>
        <p className="text-center text-slate-500 py-16">{t('noPermission')}</p>
      </AppLayout>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', nameAr: '', code: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({ name: dept.name, nameAr: dept.nameAr || '', code: dept.code || '', description: dept.description || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    const url = editing ? `/api/departments/${editing.id}` : '/api/departments';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      notify(t('savedSuccessfully'));
      setShowModal(false);
      fetchData();
    } else {
      notify(t('error'), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
    if (res.ok) { notify(t('deletedSuccessfully')); fetchData(); }
    else notify(t('error'), 'error');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{t('departments')}</h1>
            <p className="page-subtitle">{t('manageDepartments')}</p>
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4" /> {t('addNew')}</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-lotus-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map((dept) => (
              <div key={dept.id} className="premium-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-lotus-50 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-lotus-600" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(dept)} className="p-2 hover:bg-slate-100 rounded-lg"><Pencil className="w-4 h-4 text-slate-400" /></button>
                    <button onClick={() => handleDelete(dept.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900">{locale === 'ar' && dept.nameAr ? dept.nameAr : dept.name}</h3>
                {dept.code && <p className="text-xs text-slate-400 font-mono mt-1">{dept.code}</p>}
                {dept.description && <p className="text-sm text-slate-500 mt-2">{dept.description}</p>}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-sm text-slate-500">{dept._count?.assets || 0} {t('assets')}</span>
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
          <Textarea label={t('description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave}>{t('save')}</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
