'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type CompanyLogoSize = 'sm' | 'md' | 'lg' | 'hero' | 'sidebar' | 'card';

const sizeClasses: Record<CompanyLogoSize, string> = {
  sm: 'h-8 w-auto max-w-[120px] object-contain',
  md: 'h-12 w-auto max-w-[180px] object-contain',
  lg: 'h-16 w-auto max-w-[240px] object-contain',
  hero: 'h-[280px] w-auto max-w-[560px] object-contain object-left',
  sidebar: 'w-full h-auto max-h-[80px] object-contain object-center',
  card: 'w-full h-auto max-h-[100px] object-contain object-center',
};

interface CompanyLogoProps {
  src: string;
  alt?: string;
  size?: CompanyLogoSize;
  className?: string;
  onError?: () => void;
}

export function CompanyLogo({
  src,
  alt = 'Company logo',
  size = 'md',
  className,
  onError,
}: CompanyLogoProps) {
  const [failed, setFailed] = useState(false);
  const [cacheKey, setCacheKey] = useState(0);

  useEffect(() => {
    setFailed(false);
    setCacheKey(Date.now());
  }, [src]);

  if (failed) {
    onError?.();
    return null;
  }

  const logoSrc = `${src.startsWith('/api/') ? src : '/api/settings/logo'}?v=${cacheKey}`;

  return (
    <img
      src={logoSrc}
      alt={alt}
      onError={() => setFailed(true)}
      className={cn(sizeClasses[size], className)}
    />
  );
}
