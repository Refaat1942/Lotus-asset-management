'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Package, Pencil, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AssetForm, AssetFormData, emptyAssetForm } from '@/components/assets/AssetForm';
import { useApp } from '@/contexts/AppContext';
import { PERMISSIONS } from '@/lib/permissions';
import { formatCurrency } from '@/lib/utils';

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  nameAr?: string;
  category?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  status: string;
  condition?: string;
  departmentId?: string;
  branchId?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  depreciationRate?: number;
  notes?: string;
  department?: { name: string; nameAr?: string };
  branch?: { name: string; nameAr?: string };
  currentAssignee?: { name: string };
}

function toForm(asset?: Asset): AssetFormData {
  if (!asset) return emptyAssetForm();
  return {
    assetCode: asset.assetCode,
    name: asset.name,
    nameAr: asset.nameAr || '',
    category: asset.category || '',
    serialNumber: asset.serialNumber || '',
    model: asset.model || '',
    manufacturer: asset.manufacturer || '',
    departmentId: asset.departmentId || '',
    branchId: asset.branchId || '',
    status: asset.status || 'AVAILABLE',
    condition: asset.condition || 'GOOD',
    purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
    purchasePrice: asset.purchasePrice?.toString() || '',
    currentValue: asset.currentValue?.toString() || '',
    depreciationRate: asset.depreciationRate?.toString() || '',
    notes: asset.notes || '',
  };
}

function toPayload(form: AssetFormData) {
  return {
    ...form,
    purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
    currentValue: form.currentValue ? parseFloat(form.currentValue) : null,
    depreciationRate: form.depreciationRate ? parseFloat(form.depreciationRate) : null,
    departmentId: form.departmentId || null,
    branchId: form.branchId || null,
    purchaseDate: form.purchaseDate || null,
  };
}

export default function AssetsPage() {
  const { t, locale, hasPermission, notify } = useApp();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState<AssetFormData>(emptyAssetForm());

  const fetchAssets = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (departmentId) params.set('departmentId', departmentId);
    if (branchId) params.set('branchId', branchId);
    if (status) params.set('status', status);

    fetch(`/api/assets?${params}`)
      .then((r) => r.json())
      .then((data) => { setAssets(data.assets || []); setTotal(data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, departmentId, branchId, status]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);
  useEffect(() => {
    fetch('/api/departments').then((r) => r.json()).then(setDepartments).catch(() => {});
    fetch('/api/branches').then((r) => r.json()).then(setBranches).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyAssetForm());
    setShowModal(true);
  };

  const openEdit = (asset: Asset) => {
    setEditing(asset);
    setForm(toForm(asset));
    setShowModal(true);
  };

  const handleSave = async () => {
    const url = editing ? `/api/assets/${editing.id}` : '/api/assets';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toPayload(form)),
    });
    if (res.ok) {
      notify(t('savedSuccessfully'));
      setShowModal(false);
      fetchAssets();
    } else {
      const data = await res.json();
      notify(data.error || t('error'), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    if (res.ok) {
      notify(t('assetDeleted'));
      fetchAssets();
    } else {
      notify(t('error'), 'error');
    }
  };

  const statusOptions = [
    { value: '', label: t('all') },
    ...['AVAILABLE', 'ASSIGNED', 'IN_MAINTENANCE', 'IN_REPAIR', 'RETIRED', 'LOST', 'DISPOSED'].map((s) => ({
      value: s, label: t(`statuses.${s}`),
    })),
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{t('assets')}</h1>
            <p className="page-subtitle">{total} {t('results')}</p>
          </div>
          {hasPermission(PERMISSIONS.CREATE_ASSETS) && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> {t('addNew')}
            </Button>
          )}
        </div>

        <div className="premium-card p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <Search className="absolute top-3 w-4 h-4 text-slate-400" style={{ insetInlineStart: '0.75rem' }} />
              <input
                className="input-field ps-10"
                placeholder={t('search')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select
              options={[{ value: '', label: t('all') }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
              value={departmentId}
              onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }}
            />
            <Select
              options={[{ value: '', label: t('all') }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
              value={branchId}
              onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
            />
            <Select options={statusOptions} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="premium-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin h-8 w-8 border-4 border-lotus-500 border-t-transparent rounded-full" />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('noData')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="table-header">{t('assetCode')}</th>
                    <th className="table-header">{t('assetName')}</th>
                    <th className="table-header">{t('category')}</th>
                    <th className="table-header">{t('department')}</th>
                    <th className="table-header">{t('branch')}</th>
                    <th className="table-header">{t('assignee')}</th>
                    <th className="table-header">{t('status')}</th>
                    <th className="table-header">{t('currentValue')}</th>
                    <th className="table-header">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="table-cell font-mono text-xs font-medium text-lotus-700">{asset.assetCode}</td>
                      <td className="table-cell font-medium">{asset.name}</td>
                      <td className="table-cell">{asset.category || '-'}</td>
                      <td className="table-cell">{asset.department?.name || '-'}</td>
                      <td className="table-cell">{asset.branch?.name || '-'}</td>
                      <td className="table-cell">{asset.currentAssignee?.name || '-'}</td>
                      <td className="table-cell"><StatusBadge status={asset.status} /></td>
                      <td className="table-cell">{formatCurrency(asset.currentValue, locale)}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <Link href={`/assets/${asset.id}`} className="p-2 hover:bg-slate-100 rounded-lg text-lotus-600" title={t('view')}>
                            <Eye className="w-4 h-4" />
                          </Link>
                          {hasPermission(PERMISSIONS.EDIT_ASSETS) && (
                            <button onClick={() => openEdit(asset)} className="p-2 hover:bg-slate-100 rounded-lg" title={t('edit')}>
                              <Pencil className="w-4 h-4 text-slate-400" />
                            </button>
                          )}
                          {hasPermission(PERMISSIONS.DELETE_ASSETS) && (
                            <button onClick={() => handleDelete(asset.id)} className="p-2 hover:bg-red-50 rounded-lg" title={t('delete')}>
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > 20 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">
                {t('of')} {Math.min(page * 20, total)} {total}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>←</Button>
                <Button variant="secondary" size="sm" disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>→</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? t('editAsset') : t('create') + ' ' + t('assets')} size="lg">
        <AssetForm form={form} setForm={setForm} departments={departments} branches={branches} t={t} isEdit={!!editing} />
        <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => setShowModal(false)}>{t('cancel')}</Button>
          <Button onClick={handleSave}>{t('save')}</Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
