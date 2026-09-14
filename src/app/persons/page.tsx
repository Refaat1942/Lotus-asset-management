'use client';

import { useEffect, useState } from 'react';
import { Plus, User, Pencil, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/contexts/AppContext';

interface Person {
  id: string;
  name: string;
  nameAr?: string;
  employeeId?: string;
  departmentId?: string;
  department?: { name: string };
  isActive: boolean;
}

export default function PersonsPage() {
  const { t, locale, notify } = useApp();
  const [persons, setPersons] = useState<Person[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [form, setForm] = useState({ name: '', nameAr: '', employeeId: '', departmentId: '' });

  const fetchData = () => {
    Promise.all([
      fetch('/api/persons').then((r) => r.json()),
      fetch('/api/departments').then((r) => r.json()),
    ])
      .then(([p, d]) => { setPersons(p); setDepartments(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', nameAr: '', employeeId: '', departmentId: '' });
    setShowModal(true);
  };

  const openEdit = (person: Person) => {
    setEditing(person);
    setForm({ name: person.name, nameAr: person.nameAr || '', employeeId: person.employeeId || '', departmentId: person.departmentId || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    const url = editing ? `/api/persons/${editing.id}` : '/api/persons';
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { notify(t('savedSuccessfully')); setShowModal(false); fetchData(); }
    else { const d = await res.json(); notify(d.error || t('error'), 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/persons/${id}`, { method: 'DELETE' });
    if (res.ok) { notify(t('deletedSuccessfully')); fetchData(); }
    else { const d = await res.json(); notify(d.error || t('error'), 'error'); }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{t('persons')}</h1>
            <p className="page-subtitle">{t('managePersons')}</p>
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4" /> {t('addNew')}</Button>
        </div>

        <div className="premium-card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-lotus-500 border-t-transparent rounded-full" /></div>
          ) : persons.length === 0 ? (
            <p className="text-center text-slate-400 py-16">{t('noData')}</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-header">{t('name')}</th>
                  <th className="table-header">{t('employeeId')}</th>
                  <th className="table-header">{t('department')}</th>
                  <th className="table-header">{t('status')}</th>
                  <th className="table-header">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {persons.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50/50">
                    <td className="table-cell font-medium">{locale === 'ar' && person.nameAr ? person.nameAr : person.name}</td>
                    <td className="table-cell font-mono text-xs">{person.employeeId || '-'}</td>
                    <td className="table-cell">{person.department?.name || '-'}</td>
                    <td className="table-cell">
                      <span className={`status-badge ${person.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {person.isActive ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(person)} className="p-2 hover:bg-slate-100 rounded-lg"><Pencil className="w-4 h-4 text-slate-400" /></button>
                        <button onClick={() => handleDelete(person.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? t('edit') : t('create')}>
        <div className="space-y-4">
          <Input label={t('name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t('name') + ' (AR)'} value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          <Input label={t('employeeId')} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
          <Select label={t('department')} options={[{ value: '', label: '-' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]} value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave}>{t('save')}</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
