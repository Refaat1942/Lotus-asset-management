'use client';

import Link from 'next/link';
import { Eye, MapPin, User, Hash } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CategoryVisual } from './CategoryVisual';
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
}

export function AssetCategoryBox({ category, assets, locale, t }: AssetCategoryBoxProps) {
  const sample = assets[0];
  const totalValue = assets.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0);

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
          />
          <span className="absolute -bottom-2 -end-2 bg-lotus-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            {assets.length}
          </span>
        </div>
      </div>

      <div className="premium-card overflow-hidden h-full flex flex-col">
        <div className="bg-gradient-to-br from-lotus-50 via-white to-slate-50 px-6 pt-8 pb-4 border-b border-slate-100 ps-28 sm:ps-32">
          <h2 className="text-lg font-bold text-slate-900 leading-tight">{category}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {assets.length} {t('assets')} · {formatCurrency(totalValue, locale)}
          </p>
        </div>

        <div className="p-4 space-y-3 flex-1 max-h-[420px] overflow-y-auto">
          {assets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} locale={locale} t={t} />
          ))}
        </div>
      </div>
    </article>
  );
}

function AssetRow({ asset, locale, t }: { asset: AssetListItem; locale: string; t: (key: string) => string }) {
  return (
    <div className="group flex gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-lotus-200 hover:shadow-md transition-all duration-200">
      <CategoryVisual
        category={asset.category}
        name={asset.name}
        device={asset.device}
        manufacturer={asset.manufacturer}
        size="sm"
        className="!border-2 !ring-1 shrink-0"
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
