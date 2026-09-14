'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit, Trash2, UserCheck, RotateCcw, ArrowRightLeft,
  Wrench, AlertTriangle, TrendingDown,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge, ConditionBadge } from '@/components/ui/StatusBadge';
import { AssetTimeline } from '@/components/assets/AssetTimeline';
import { AssetForm, AssetFormData, emptyAssetForm } from '@/components/assets/AssetForm';
import { AssetQRCode } from '@/components/assets/AssetQRCode';
import { useApp } from '@/contexts/AppContext';
import { PERMISSIONS } from '@/lib/permissions';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale, hasPermission, notify } = useApp();
  const [asset, setAsset] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [persons, setPersons] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [modal, setModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [editForm, setEditForm] = useState<AssetFormData>(emptyAssetForm());

  const fetchAsset = () => {
    fetch(`/api/assets/${id}`)
      .then((r) => r.json())
      .then(setAsset)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAsset(); }, [id]);
  useEffect(() => {
    fetch('/api/persons').then((r) => r.json()).then(setPersons).catch(() => {});
    fetch('/api/branches').then((r) => r.json()).then(setBranches).catch(() => {});
    fetch('/api/departments').then((r) => r.json()).then(setDepartments).catch(() => {});
  }, []);

  const handleAction = async (endpoint: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/assets/${id}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      notify(t('savedSuccessfully'));
      setModal(null);
      setFormData({});
      fetchAsset();
    } else {
      const data = await res.json();
      notify(data.error || t('error'), 'error');
    }
  };

  const openEdit = () => {
    if (!asset) return;
    const dept = asset.department as { id: string } | null;
    const br = asset.branch as { id: string } | null;
    setEditForm({
      assetCode: asset.assetCode as string,
      name: asset.name as string,
      nameAr: (asset.nameAr as string) || '',
      category: (asset.category as string) || '',
      serialNumber: (asset.serialNumber as string) || '',
      model: (asset.model as string) || '',
      manufacturer: (asset.manufacturer as string) || '',
      departmentId: dept?.id || (asset.departmentId as string) || '',
      branchId: br?.id || (asset.branchId as string) || '',
      status: asset.status as string,
      condition: asset.condition as string,
      purchaseDate: asset.purchaseDate ? String(asset.purchaseDate).split('T')[0] : '',
      purchasePrice: asset.purchasePrice ? String(asset.purchasePrice) : '',
      currentValue: asset.currentValue ? String(asset.currentValue) : '',
      depreciationRate: asset.depreciationRate ? String(asset.depreciationRate) : '',
      notes: (asset.notes as string) || '',
    });
    setModal('edit');
  };

  const handleEditSave = async () => {
    const res = await fetch(`/api/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        purchasePrice: editForm.purchasePrice ? parseFloat(editForm.purchasePrice) : null,
        currentValue: editForm.currentValue ? parseFloat(editForm.currentValue) : null,
        depreciationRate: editForm.depreciationRate ? parseFloat(editForm.depreciationRate) : null,
        departmentId: editForm.departmentId || null,
        branchId: editForm.branchId || null,
        purchaseDate: editForm.purchaseDate || null,
      }),
    });
    if (res.ok) {
      notify(t('savedSuccessfully'));
      setModal(null);
      fetchAsset();
    } else {
      notify(t('error'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    if (res.ok) {
      notify(t('assetDeleted'));
      router.push('/assets');
    } else {
      notify(t('error'), 'error');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-lotus-500 border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  if (!asset) {
    return (
      <AppLayout>
        <p className="text-center text-slate-500 py-16">{t('noData')}</p>
      </AppLayout>
    );
  }

  const dept = asset.department as { id?: string; name: string; nameAr?: string } | null;
  const branch = asset.branch as { id?: string; name: string; nameAr?: string } | null;
  const assignee = asset.currentAssignee as { name: string; nameAr?: string } | null;
  const history = (asset.history as unknown[]) || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/assets" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="page-title">{asset.name as string}</h1>
              <p className="page-subtitle font-mono">{asset.assetCode as string}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={asset.status as string} />
            <ConditionBadge condition={asset.condition as string} />
            {hasPermission(PERMISSIONS.EDIT_ASSETS) && (
              <Button size="sm" variant="secondary" onClick={openEdit}>
                <Edit className="w-4 h-4" /> {t('edit')}
              </Button>
            )}
            {hasPermission(PERMISSIONS.DELETE_ASSETS) && (
              <Button size="sm" variant="danger" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> {t('delete')}
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {hasPermission(PERMISSIONS.ASSIGN_ASSETS) && !assignee && (
            <Button size="sm" onClick={() => setModal('assign')}><UserCheck className="w-4 h-4" /> {t('assign')}</Button>
          )}
          {hasPermission(PERMISSIONS.ASSIGN_ASSETS) && assignee && (
            <Button size="sm" variant="secondary" onClick={() => handleAction('return', {})}>
              <RotateCcw className="w-4 h-4" /> {t('returnAsset')}
            </Button>
          )}
          {hasPermission(PERMISSIONS.TRANSFER_ASSETS) && (
            <Button size="sm" variant="secondary" onClick={() => setModal('transfer')}>
              <ArrowRightLeft className="w-4 h-4" /> {t('transfer')}
            </Button>
          )}
          {hasPermission(PERMISSIONS.EDIT_ASSETS) && (
            <>
              <Button size="sm" variant="secondary" onClick={() => setModal('maintenance')}>
                <Wrench className="w-4 h-4" /> {t('maintenance')}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setModal('issue')}>
                <AlertTriangle className="w-4 h-4" /> {t('issue')}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setModal('depreciation')}>
                <TrendingDown className="w-4 h-4" /> {t('recordDepreciation')}
              </Button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="premium-card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">{t('basicInfo')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label={t('assetCode')} value={asset.assetCode as string} />
                <InfoItem label={t('assetName')} value={asset.name as string} />
                <InfoItem label={t('category')} value={(asset.category as string) || '-'} />
                <InfoItem label={t('serialNumber')} value={(asset.serialNumber as string) || '-'} />
                <InfoItem label={t('model')} value={(asset.model as string) || '-'} />
                <InfoItem label={t('manufacturer')} value={(asset.manufacturer as string) || '-'} />
                <InfoItem label={t('department')} value={dept ? (locale === 'ar' ? dept.nameAr || dept.name : dept.name) : '-'} />
                <InfoItem label={t('branch')} value={branch ? (locale === 'ar' ? branch.nameAr || branch.name : branch.name) : '-'} />
                <InfoItem label={t('currentHolder')} value={assignee?.name || '-'} />
                <InfoItem label={t('purchaseDate')} value={formatDate(asset.purchaseDate as string, locale)} />
              </div>
              {Boolean(asset.notes) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">{t('notes')}</p>
                  <p className="text-sm text-slate-700">{String(asset.notes)}</p>
                </div>
              )}
            </div>

            <div className="premium-card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">{t('financialInfo')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <InfoItem label={t('purchasePrice')} value={formatCurrency(asset.purchasePrice as number, locale)} />
                <InfoItem label={t('currentValue')} value={formatCurrency(asset.currentValue as number, locale)} />
                <InfoItem label={t('depreciation')} value={asset.depreciationRate ? `${asset.depreciationRate}%` : '-'} />
              </div>
            </div>

            <div className="premium-card p-6">
              <h3 className="font-semibold text-slate-900 mb-6">{t('timeline')}</h3>
              <AssetTimeline events={history as Parameters<typeof AssetTimeline>[0]['events']} />
            </div>
          </div>

          <div className="space-y-6">
            <AssetQRCode
              assetId={id}
              assetCode={asset.assetCode as string}
              assetName={asset.name as string}
              department={dept?.name}
              branch={branch?.name}
            />

            <div className="premium-card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">{t('assignmentInfo')}</h3>
              {assignee ? (
                <InfoItem label={t('currentHolder')} value={assignee.name} />
              ) : (
                <p className="text-sm text-slate-400">{t('unassignedAssets')}</p>
              )}
            </div>

            <div className="premium-card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">{t('locationInfo')}</h3>
              <InfoItem label={t('branch')} value={branch?.name || '-'} />
              <InfoItem label={t('department')} value={dept?.name || '-'} />
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={modal === 'edit'} onClose={() => setModal(null)} title={t('editAsset')} size="lg">
        <AssetForm form={editForm} setForm={setEditForm} departments={departments} branches={branches} t={t} isEdit />
        <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => setModal(null)}>{t('cancel')}</Button>
          <Button onClick={handleEditSave}>{t('save')}</Button>
        </div>
      </Modal>

      <Modal isOpen={modal === 'assign'} onClose={() => setModal(null)} title={t('assign')}>
        <div className="space-y-4">
          <Select
            label={t('selectPerson')}
            options={[{ value: '', label: '-' }, ...persons.map((p) => ({ value: p.id, label: p.name }))]}
            value={formData.personId || ''}
            onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
          />
          <Textarea label={t('notes')} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal(null)}>{t('cancel')}</Button>
            <Button onClick={() => handleAction('assign', { personId: formData.personId, notes: formData.notes })}>{t('assign')}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modal === 'transfer'} onClose={() => setModal(null)} title={t('transfer')}>
        <div className="space-y-4">
          <Select
            label={t('transferTo')}
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
            value={formData.toBranchId || ''}
            onChange={(e) => setFormData({ ...formData, toBranchId: e.target.value })}
          />
          <Textarea label={t('notes')} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal(null)}>{t('cancel')}</Button>
            <Button onClick={() => handleAction('transfer', { toBranchId: formData.toBranchId, notes: formData.notes })}>{t('transfer')}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modal === 'maintenance' || modal === 'issue'} onClose={() => setModal(null)} title={modal === 'issue' ? t('issue') : t('maintenance')}>
        <div className="space-y-4">
          <Textarea label={t('description')} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal(null)}>{t('cancel')}</Button>
            <Button onClick={() => handleAction('maintenance', { type: modal, description: formData.description })}>{t('save')}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modal === 'depreciation'} onClose={() => setModal(null)} title={t('recordDepreciation')}>
        <div className="space-y-4">
          <Input label={t('currentValue')} type="number" value={formData.newValue || ''} onChange={(e) => setFormData({ ...formData, newValue: e.target.value })} />
          <Textarea label={t('notes')} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal(null)}>{t('cancel')}</Button>
            <Button onClick={() => handleAction('depreciation', { newValue: parseFloat(formData.newValue), notes: formData.notes })}>{t('save')}</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
