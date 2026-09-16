'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, MapPin, User, Hash } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getAssetImageUrl } from '@/lib/asset-images';
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
  const [imageUrl, setImageUrl] = useState(() =>
    getAssetImageUrl(category, assets[0]?.name, assets[0]?.device, assets[0]?.manufacturer)
  );

  useEffect(() => {
    const sample = assets[0];
    const params = new URLSearchParams({
      q: category,
      category,
      name: sample?.name || '',
      device: sample?.device || '',
      manufacturer: sample?.manufacturer || '',
    });
    fetch(`/api/assets/category-image?${params}`)
      .then((r) => r.json())
      .then((data) => { if (data.url) setImageUrl(data.url); })
      .catch(() => {});
  }, [category, assets]);

  const totalValue = assets.reduce((sum, a) => sum + (Number(a.currentValue) || 0), 0);

  return (
    <article className="relative pt-10">
      {/* Category image — floats outside the box */}
      <div className="absolute top-0 start-6 z-10">
        <div className="relative">
          <img
            src={imageUrl}
            alt={category}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-xl border-4 border-white ring-2 ring-lotus-100"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getAssetImageUrl(category);
            }}
          />
          <span className="absolute -bottom-2 -end-2 bg-lotus-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            {assets.length}
          </span>
        </div>
      </div>

      {/* Category box */}
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
  const thumb = getAssetImageUrl(asset.category, asset.name, asset.device, asset.manufacturer);

  return (
    <div className="group flex gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-lotus-200 hover:shadow-md transition-all duration-200">
      <img
        src={thumb}
        alt=""
        className="w-12 h-12 rounded-lg object-cover shrink-0 ring-1 ring-slate-100"
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
