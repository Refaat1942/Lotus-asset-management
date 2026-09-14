'use client';

import { Package } from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';
import { cn } from '@/lib/utils';

interface LogoBrandProps {
  logo?: string | null;
  appName: string;
  tagline?: string;
  variant: 'hero' | 'sidebar' | 'card';
  onLogoError?: () => void;
  logoFailed?: boolean;
  className?: string;
}

export function LogoBrand({
  logo,
  appName,
  tagline,
  variant,
  onLogoError,
  logoFailed = false,
  className,
}: LogoBrandProps) {
  const showLogo = logo && !logoFailed;

  if (variant === 'hero') {
    return (
      <div className={cn('w-full', className)}>
        {showLogo ? (
          <CompanyLogo
            src={logo}
            size="hero"
            onError={onLogoError}
            className="mix-blend-multiply drop-shadow-sm"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
            <Package className="w-10 h-10 text-white" />
          </div>
        )}
        {tagline && (
          <p className="mt-10 text-lg text-white/90 leading-relaxed max-w-md">{tagline}</p>
        )}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={cn('w-full', className)}>
        {showLogo ? (
          <div className="rounded-xl bg-gradient-to-b from-slate-50 to-white border border-slate-100 px-4 py-5 flex items-center justify-center min-h-[88px]">
            <CompanyLogo src={logo} size="sidebar" onError={onLogoError} />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-header flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-slate-900 text-sm leading-tight">{appName}</h1>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-slate-100 bg-white shadow-sm px-6 py-5 flex items-center justify-center', className)}>
      {showLogo ? (
        <CompanyLogo src={logo} size="card" onError={onLogoError} />
      ) : (
        <p className="text-sm text-slate-400">{appName}</p>
      )}
    </div>
  );
}
