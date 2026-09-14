'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type CompanyLogoSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<CompanyLogoSize, string> = {
  sm: 'h-8 max-w-[100px]',
  md: 'h-10 max-w-[140px]',
  lg: 'h-16 max-w-[220px]',
  xl: 'h-20 max-w-[280px]',
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

  if (failed) {
    onError?.();
    return null;
  }

  const logoSrc = src.startsWith('/api/') ? src : src.startsWith('/uploads/') ? '/api/settings/logo' : src;

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
