'use client';

import { useMemo } from 'react';
import { AssetCategoryBox, AssetListItem } from './AssetCategoryBox';
import { sortCategoryKeys } from '@/lib/asset-images';

interface AssetsCategoryGridProps {
  assets: AssetListItem[];
  locale: string;
  t: (key: string) => string;
  uncategorizedLabel: string;
}

export function AssetsCategoryGrid({ assets, locale, t, uncategorizedLabel }: AssetsCategoryGridProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, AssetListItem[]>();
    for (const asset of assets) {
      const key = asset.category?.trim() || uncategorizedLabel;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(asset);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.assetCode.localeCompare(b.assetCode));
    }
    return map;
  }, [assets, uncategorizedLabel]);

  const sortedCategories = useMemo(
    () => sortCategoryKeys([...grouped.keys()]),
    [grouped]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {sortedCategories.map((category) => (
        <AssetCategoryBox
          key={category}
          category={category}
          assets={grouped.get(category) || []}
          locale={locale}
          t={t}
        />
      ))}
    </div>
  );
}
