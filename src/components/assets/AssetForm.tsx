'use client';

import { Input, Select, Textarea } from '@/components/ui/Input';

export interface AssetFormData {
  assetCode: string;
  name: string;
  nameAr: string;
  category: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  departmentId: string;
  branchId: string;
  status: string;
  condition: string;
  purchaseDate: string;
  purchasePrice: string;
  currentValue: string;
  depreciationRate: string;
  notes: string;
}

interface AssetFormProps {
  form: AssetFormData;
  setForm: (form: AssetFormData) => void;
  departments: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  t: (key: string) => string;
  isEdit?: boolean;
}

const STATUS_OPTIONS = ['AVAILABLE', 'ASSIGNED', 'IN_MAINTENANCE', 'IN_REPAIR', 'RETIRED', 'LOST', 'DISPOSED'];
const CONDITION_OPTIONS = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'];

export function AssetForm({ form, setForm, departments, branches, t, isEdit }: AssetFormProps) {
  const update = (field: keyof AssetFormData, value: string) => setForm({ ...form, [field]: value });

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pe-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label={t('assetCode')} value={form.assetCode} onChange={(e) => update('assetCode', e.target.value)} required disabled={isEdit} />
        <Input label={t('assetName')} value={form.name} onChange={(e) => update('name', e.target.value)} required />
        <Input label={t('name') + ' (AR)'} value={form.nameAr} onChange={(e) => update('nameAr', e.target.value)} />
        <Input label={t('category')} value={form.category} onChange={(e) => update('category', e.target.value)} />
        <Input label={t('serialNumber')} value={form.serialNumber} onChange={(e) => update('serialNumber', e.target.value)} />
        <Input label={t('model')} value={form.model} onChange={(e) => update('model', e.target.value)} />
        <Input label={t('manufacturer')} value={form.manufacturer} onChange={(e) => update('manufacturer', e.target.value)} />
        <Select label={t('department')} options={[{ value: '', label: '-' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]} value={form.departmentId} onChange={(e) => update('departmentId', e.target.value)} />
        <Select label={t('branch')} options={[{ value: '', label: '-' }, ...branches.map((b) => ({ value: b.id, label: b.name }))]} value={form.branchId} onChange={(e) => update('branchId', e.target.value)} />
        <Select label={t('status')} options={STATUS_OPTIONS.map((s) => ({ value: s, label: t(`statuses.${s}`) }))} value={form.status} onChange={(e) => update('status', e.target.value)} />
        <Select label={t('condition')} options={CONDITION_OPTIONS.map((c) => ({ value: c, label: t(`conditions.${c}`) }))} value={form.condition} onChange={(e) => update('condition', e.target.value)} />
        <Input label={t('purchaseDate')} type="date" value={form.purchaseDate} onChange={(e) => update('purchaseDate', e.target.value)} />
        <Input label={t('purchasePrice')} type="number" value={form.purchasePrice} onChange={(e) => update('purchasePrice', e.target.value)} />
        <Input label={t('currentValue')} type="number" value={form.currentValue} onChange={(e) => update('currentValue', e.target.value)} />
        <Input label={t('depreciation') + ' (%)'} type="number" value={form.depreciationRate} onChange={(e) => update('depreciationRate', e.target.value)} />
      </div>
      <Textarea label={t('notes')} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
    </div>
  );
}

export const emptyAssetForm = (): AssetFormData => ({
  assetCode: '', name: '', nameAr: '', category: '', serialNumber: '', model: '', manufacturer: '',
  departmentId: '', branchId: '', status: 'AVAILABLE', condition: 'GOOD',
  purchaseDate: '', purchasePrice: '', currentValue: '', depreciationRate: '', notes: '',
});
