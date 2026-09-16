'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, MapPin, User, Hash, Pencil, Image as ImageIcon, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryVisual } from './CategoryVisual';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';
import { PERMISSIONS } from '@/lib/permissions';
import { formatCurrency } from '@/lib/utils';

export interface AssetListItem {
  id: string;
  assetCode: string;
  name: string;
  category?: string;
  serialNumber?: string;
  device?: string;
  model?: string;
  manufacturer?: string;
  branch?: { name: string };
  currentAssignee?: { name: string };
  status: string;
  currentValue?: number;
}

interface AssetCategoryBoxProps {
  category: string;
  assets: AssetListItem[];
  locale: string;
  t: (key: string) => string;
  imageUrl?: string | null;
  onImageChange?: (imageUrl: string | null) => void;
}

export function AssetCategoryBox({ category, assets, locale, t, imageUrl, onImageChange }: AssetCategoryBoxProps) {
  const { hasPermission } = useApp();
  const [showImageModal, setShowImageModal] = useState(false);
  const sample = assets[0];
  const totalValue = assets.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0);
  const canEditImage = hasPermission(PERMISSIONS.EDIT_ASSETS) && !!onImageChange;

  return (
    <article className="relative pt-10">
      <div className="absolute top-0 start-6 z-10">
        <div className="relative">
          <CategoryVisual
            category={category}
            name={sample?.name}
            device={sample?.device}
            manufacturer={sample?.manufacturer}
            size="lg"
            imageUrl={imageUrl}
          />
          <span className="absolute -bottom-2 -end-2 bg-lotus-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            {assets.length}
          </span>
          {canEditImage && (
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              title={imageUrl ? t('changeProductImage') : t('setProductImage')}
              className="absolute -top-1.5 -end-1.5 w-7 h-7 flex items-center justify-center rounded-full bg-white text-lotus-600 shadow-md border border-slate-200 hover:bg-lotus-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {canEditImage && (
        <CategoryImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          category={category}
          currentImageUrl={imageUrl}
          onSaved={(url) => { onImageChange?.(url); setShowImageModal(false); }}
          t={t}
        />
      )}

      <div className="premium-card overflow-hidden h-full flex flex-col">
        <div className="bg-gradient-to-br from-lotus-50 via-white to-slate-50 px-6 pt-8 pb-4 border-b border-slate-100 ps-28 sm:ps-32">
          <h2 className="text-lg font-bold text-slate-900 leading-tight">{category}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {assets.length} {t('assets')} · {formatCurrency(totalValue, locale)}
          </p>
        </div>

        <div className="p-4 space-y-3 flex-1 max-h-[420px] overflow-y-auto">
          {assets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} locale={locale} t={t} imageUrl={imageUrl} />
          ))}
        </div>
      </div>
    </article>
  );
}

function AssetRow({
  asset,
  locale,
  t,
  imageUrl,
}: {
  asset: AssetListItem;
  locale: string;
  t: (key: string) => string;
  imageUrl?: string | null;
}) {
  return (
    <div className="group flex gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-lotus-200 hover:shadow-md transition-all duration-200">
      <CategoryVisual
        category={asset.category}
        name={asset.name}
        device={asset.device}
        manufacturer={asset.manufacturer}
        size="sm"
        className="!border-2 !ring-1 shrink-0"
        imageUrl={imageUrl}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate" title={asset.name}>{asset.name}</p>
            <p className="text-xs font-mono text-lotus-600 mt-0.5">{asset.assetCode}</p>
          </div>
          <StatusBadge status={asset.status} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-500">
          {asset.serialNumber && (
            <span className="flex items-center gap-1 truncate" title={asset.serialNumber}>
              <Hash className="w-3 h-3 shrink-0" /> {asset.serialNumber}
            </span>
          )}
          {asset.branch?.name && (
            <span className="flex items-center gap-1 truncate" title={asset.branch.name}>
              <MapPin className="w-3 h-3 shrink-0" /> {asset.branch.name}
            </span>
          )}
          {asset.currentAssignee?.name && (
            <span className="flex items-center gap-1 truncate col-span-2" title={asset.currentAssignee.name}>
              <User className="w-3 h-3 shrink-0" /> {asset.currentAssignee.name}
            </span>
          )}
          {(asset.model || asset.manufacturer) && (
            <span className="truncate col-span-2 text-slate-400">
              {[asset.manufacturer, asset.model].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
          <span className="text-xs font-medium text-lotus-700">{formatCurrency(asset.currentValue, locale)}</span>
          <Link
            href={`/assets/${asset.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-lotus-600 hover:text-lotus-800 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Eye className="w-3.5 h-3.5" /> {t('view')}
          </Link>
        </div>
      </div>
    </div>
  );
}

interface CategoryImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  currentImageUrl?: string | null;
  onSaved: (imageUrl: string | null) => void;
  t: (key: string) => string;
}

function CategoryImageModal({ isOpen, onClose, category, currentImageUrl, onSaved, t }: CategoryImageModalProps) {
  const { notify } = useApp();
  const [url, setUrl] = useState(currentImageUrl || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = url.trim();
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      notify(t('invalidImageUrl'), 'error');
      return;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      notify(t('invalidImageUrl'), 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/assets/category-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, imageUrl: trimmed }),
      });
      if (res.ok) {
        notify(t('savedSuccessfully'));
        onSaved(trimmed);
      } else {
        const data = await res.json().catch(() => ({}));
        notify(data.error || t('error'), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/assets/category-images?category=${encodeURIComponent(category)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        notify(t('savedSuccessfully'));
        setUrl('');
        onSaved(null);
      } else {
        notify(t('error'), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${t('productImage')} · ${category}`} size="sm">
      <div className="space-y-4">
        {url && (
          <img
            src={url}
            alt=""
            className="w-24 h-24 rounded-2xl object-cover border-4 border-white ring-2 ring-lotus-100 shadow-md mx-auto"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <Input
          label={t('imageUrl')}
          placeholder={t('imageUrlPlaceholder')}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          autoFocus
        />
        <p className="text-xs text-slate-400 flex items-start gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {t('productImageHint')}
        </p>
        <div className="flex items-center justify-between gap-3 pt-2">
          {currentImageUrl ? (
            <Button variant="danger" size="sm" onClick={handleRemove} disabled={saving}>
              <Trash2 className="w-3.5 h-3.5" /> {t('removeProductImage')}
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
            <Button size="sm" onClick={handleSave} loading={saving}>{t('save')}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
