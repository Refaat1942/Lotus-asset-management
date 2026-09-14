'use client';

import { useEffect, useState } from 'react';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/contexts/AppContext';
import { PERMISSIONS } from '@/lib/permissions';

interface User {
  id: string;
  username: string;
  email?: string;
  isActive: boolean;
  canChangeUsername: boolean;
  role: { id: string; name: string };
}

interface Role { id: string; name: string; }

export default function UsersPage() {
  const { t, hasPermission, notify } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ username: '', password: '', email: '', roleId: '', canChangeUsername: false });

  const fetchData = () => {
    Promise.all([fetch('/api/users').then((r) => r.json()), fetch('/api/roles').then((r) => r.json())])
      .then(([u, r]) => { setUsers(u); setRoles(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (!hasPermission(PERMISSIONS.MANAGE_USERS)) {
    return <AppLayout><p className="text-center text-slate-500 py-16">{t('noPermission')}</p></AppLayout>;
  }

  const handleSave = async () => {
    const url = editing ? `/api/users/${editing.id}` : '/api/users';
    const body = editing ? { ...form, password: form.password || undefined } : form;
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { notify(t('savedSuccessfully')); setShowModal(false); fetchData(); }
    else { const d = await res.json(); notify(d.error || t('error'), 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) { notify(t('deletedSuccessfully')); fetchData(); }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{t('users')}</h1>
            <p className="page-subtitle">{t('manageUsers')}</p>
          </div>
          <Button onClick={() => { setEditing(null); setForm({ username: '', password: '', email: '', roleId: '', canChangeUsername: false }); setShowModal(true); }}>
            <Plus className="w-4 h-4" /> {t('addNew')}
          </Button>
        </div>

        <div className="premium-card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-lotus-500 border-t-transparent rounded-full" /></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-header">{t('username')}</th>
                  <th className="table-header">{t('roleName')}</th>
                  <th className="table-header">{t('status')}</th>
                  <th className="table-header">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="table-cell font-medium">{user.username}</td>
                    <td className="table-cell">{user.role.name}</td>
                    <td className="table-cell">
                      <span className={`status-badge ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(user); setForm({ username: user.username, password: '', email: user.email || '', roleId: user.role.id, canChangeUsername: user.canChangeUsername }); setShowModal(true); }} className="p-2 hover:bg-slate-100 rounded-lg"><Pencil className="w-4 h-4 text-slate-400" /></button>
                        <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
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
          <Input label={t('username')} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!!editing} />
          <Input label={t('password')} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? 'Leave blank to keep current' : ''} />
          <Select label={t('roleName')} options={[{ value: '', label: '-' }, ...roles.map((r) => ({ value: r.id, label: r.name }))]} value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave}>{t('save')}</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
