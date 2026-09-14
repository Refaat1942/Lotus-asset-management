'use client';

import { useEffect, useState } from 'react';
import { Shield, Check, Plus, Trash2, Pencil } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/contexts/AppContext';
import { PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';

interface Permission { id: string; key: string; name: string; nameAr?: string; category: string; }
interface Role {
  id: string;
  name: string;
  nameAr?: string;
  isSystem: boolean;
  permissions: { permission: Permission }[];
}

export default function AuthorizationPage() {
  const { t, locale, hasPermission, notify } = useApp();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', nameAr: '', description: '' });
  const [editingRole, setEditingRole] = useState(false);

  const fetchData = () => {
    Promise.all([fetch('/api/roles').then((r) => r.json()), fetch('/api/permissions').then((r) => r.json())])
      .then(([r, p]) => {
        setRoles(r);
        setPermissions(p);
        if (r.length && !selectedRole) {
          setSelectedRole(r[0]);
          setSelectedPerms(new Set(r[0].permissions.map((rp: { permission: Permission }) => rp.permission.id)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (!hasPermission(PERMISSIONS.MANAGE_AUTHORIZATION)) {
    return <AppLayout><p className="text-center text-slate-500 py-16">{t('noPermission')}</p></AppLayout>;
  }

  const selectRole = (role: Role) => {
    setSelectedRole(role);
    setSelectedPerms(new Set(role.permissions.map((rp) => rp.permission.id)));
  };

  const togglePerm = (permId: string) => {
    const next = new Set(selectedPerms);
    if (next.has(permId)) next.delete(permId);
    else next.add(permId);
    setSelectedPerms(next);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    const res = await fetch(`/api/roles/${selectedRole.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: selectedRole.name,
        nameAr: selectedRole.nameAr,
        permissionIds: Array.from(selectedPerms),
      }),
    });
    if (res.ok) {
      notify(t('savedSuccessfully'));
      const updated = await res.json();
      setRoles(roles.map((r) => r.id === updated.id ? updated : r));
      setSelectedRole(updated);
    } else {
      notify(t('error'), 'error');
    }
  };

  const handleCreateRole = async () => {
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...roleForm, permissionIds: [] }),
    });
    if (res.ok) {
      notify(t('roleCreated'));
      setShowRoleModal(false);
      setRoleForm({ name: '', nameAr: '', description: '' });
      fetchData();
    } else {
      notify(t('error'), 'error');
    }
  };

  const handleUpdateRoleName = async () => {
    if (!selectedRole) return;
    const res = await fetch(`/api/roles/${selectedRole.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: roleForm.name,
        nameAr: roleForm.nameAr,
        description: roleForm.description,
        permissionIds: Array.from(selectedPerms),
      }),
    });
    if (res.ok) {
      notify(t('savedSuccessfully'));
      setShowRoleModal(false);
      setEditingRole(false);
      fetchData();
    } else {
      notify(t('error'), 'error');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });
    if (res.ok) {
      notify(t('roleDeleted'));
      if (selectedRole?.id === roleId) setSelectedRole(null);
      fetchData();
    } else {
      const data = await res.json();
      notify(data.error || t('error'), 'error');
    }
  };

  const openEditRole = () => {
    if (!selectedRole) return;
    setRoleForm({ name: selectedRole.name, nameAr: selectedRole.nameAr || '', description: '' });
    setEditingRole(true);
    setShowRoleModal(true);
  };

  const categories = Array.from(new Set(permissions.map((p) => p.category)));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{t('authorizationMatrix')}</h1>
            <p className="page-subtitle">{t('permissions')}</p>
          </div>
          <Button onClick={() => { setEditingRole(false); setRoleForm({ name: '', nameAr: '', description: '' }); setShowRoleModal(true); }}>
            <Plus className="w-4 h-4" /> {t('addRole')}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-lotus-500 border-t-transparent rounded-full" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="premium-card p-4 space-y-1">
              <h3 className="font-semibold text-slate-900 px-3 py-2">{t('roles')}</h3>
              {roles.map((role) => (
                <div key={role.id} className="flex items-center gap-1">
                  <button
                    onClick={() => selectRole(role)}
                    className={cn('flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      selectedRole?.id === role.id ? 'bg-lotus-600 text-white' : 'text-slate-600 hover:bg-slate-50')}
                  >
                    <Shield className="w-4 h-4" />
                    {locale === 'ar' && role.nameAr ? role.nameAr : role.name}
                  </button>
                  {!role.isSystem && (
                    <button onClick={() => handleDeleteRole(role.id)} className="p-2 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="lg:col-span-3 premium-card p-6">
              {selectedRole && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-slate-900 text-lg">
                      {locale === 'ar' && selectedRole.nameAr ? selectedRole.nameAr : selectedRole.name}
                    </h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={openEditRole}>
                        <Pencil className="w-4 h-4" /> {t('edit')}
                      </Button>
                      <Button onClick={handleSave}>{t('save')}</Button>
                    </div>
                  </div>

                  {categories.map((cat) => (
                    <div key={cat} className="mb-6">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{cat}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissions.filter((p) => p.category === cat).map((perm) => (
                          <button
                            key={perm.id}
                            onClick={() => togglePerm(perm.id)}
                            className={cn(
                              'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all text-start',
                              selectedPerms.has(perm.id)
                                ? 'border-lotus-300 bg-lotus-50 text-lotus-800'
                                : 'border-slate-100 hover:border-slate-200 text-slate-600'
                            )}
                          >
                            <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0',
                              selectedPerms.has(perm.id) ? 'border-lotus-500 bg-lotus-500' : 'border-slate-300')}>
                              {selectedPerms.has(perm.id) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            {locale === 'ar' && perm.nameAr ? perm.nameAr : perm.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title={editingRole ? t('edit') : t('addRole')}>
        <div className="space-y-4">
          <Input label={t('roleName')} value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} required />
          <Input label={t('roleName') + ' (AR)'} value={roleForm.nameAr} onChange={(e) => setRoleForm({ ...roleForm, nameAr: e.target.value })} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowRoleModal(false)}>{t('cancel')}</Button>
            <Button onClick={editingRole ? handleUpdateRoleName : handleCreateRole}>{t('save')}</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
