'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type CompanyLogoSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<CompanyLogoSize, string> = {
  sm: 'h-10 max-w-[140px]',
  md: 'h-14 max-w-[200px]',
  lg: 'h-20 max-w-[280px]',
  xl: 'h-28 max-w-[400px]',
};

interface CompanyLogoProps {
  src: string;
  alt?: string;
  size?: CompanyLogoSize;
  className?: string;
  framed?: boolean;
  onError?: () => void;
}

export function CompanyLogo({
  src,
  alt = 'Company logo',
  size = 'md',
  className,
  framed = false,
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
      className={cn(
        'w-auto object-contain object-left',
        sizeClasses[size],
        framed && 'rounded-lg border border-slate-200 bg-white p-1.5',
        className
      )}
    />
  );
}
