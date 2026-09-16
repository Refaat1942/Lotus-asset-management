'use client';

import { useState } from 'react';
import {
  Camera, Fingerprint, Monitor, Laptop, Wifi, Printer, Server,
  HardDrive, Smartphone, Package, type LucideIcon,
} from 'lucide-react';
import { resolveCategoryVisual, CategoryVisualType } from '@/lib/asset-images';
import { cn } from '@/lib/utils';

const ICONS: Record<CategoryVisualType, LucideIcon> = {
  dvr: Camera,
  nvr: HardDrive,
  fingerprint: Fingerprint,
  accesspoint: Wifi,
  desktop: Monitor,
  laptop: Laptop,
  monitor: Monitor,
  printer: Printer,
  server: Server,
  network: Wifi,
  phone: Smartphone,
  default: Package,
};

interface CategoryVisualProps {
  category?: string | null;
  name?: string | null;
  device?: string | null;
  manufacturer?: string | null;
  size: 'sm' | 'lg';
  className?: string;
}

const SIZE = { sm: 'w-12 h-12', lg: 'w-20 h-20 sm:w-24 sm:h-24' };
const ICON = { sm: 'w-6 h-6', lg: 'w-10 h-10 sm:w-11 sm:h-11' };

export function CategoryVisual({
  category,
  name,
  device,
  manufacturer,
  size,
  className,
}: CategoryVisualProps) {
  const visual = resolveCategoryVisual(category, name, device, manufacturer);
  const [useIcon, setUseIcon] = useState(!visual.imageUrl);

  if (!useIcon && visual.imageUrl) {
    return (
      <img
        src={visual.imageUrl}
        alt=""
        className={cn(
          SIZE[size],
          'rounded-2xl object-cover shadow-lg border-4 border-white ring-2 ring-lotus-100 bg-white',
          className
        )}
        onError={() => setUseIcon(true)}
      />
    );
  }

  const Icon = ICONS[visual.type];
  return (
    <div
      className={cn(
        SIZE[size],
        'rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg border-4 border-white ring-2 ring-lotus-100',
        visual.gradient,
        className
      )}
    >
      <Icon className={cn(ICON[size], 'text-white drop-shadow')} strokeWidth={1.75} />
    </div>
  );
}
