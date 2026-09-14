'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Building2, MapPin, UserCircle,
  FileSpreadsheet, BarChart3, Settings, Globe,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'dashboard' },
  { href: '/assets', icon: Package, label: 'assets' },
  { href: '/persons', icon: UserCircle, label: 'persons' },
  { href: '/departments', icon: Building2, label: 'departments' },
  { href: '/branches', icon: MapPin, label: 'branches' },
  { href: '/import', icon: FileSpreadsheet, label: 'import' },
  { href: '/reports', icon: BarChart3, label: 'reports' },
  { href: '/settings', icon: Settings, label: 'settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t, companyLogo, locale, setLocale } = useApp();

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  };

  return (
    <aside className="fixed top-0 bottom-0 w-64 bg-white border-e border-slate-100 flex flex-col z-40"
      style={{ insetInlineStart: 0 }}>
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {companyLogo ? (
            <img src={companyLogo} alt="Logo" className="w-10 h-10 rounded-xl object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-xl gradient-header flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-slate-900 text-sm leading-tight">{t('appName')}</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('nav-link', isActive && 'nav-link-active')}
            >
              <item.icon className="w-5 h-5" />
              <span>{t(item.label)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button onClick={toggleLanguage} className="nav-link w-full">
          <Globe className="w-5 h-5" />
          <span>{locale === 'en' ? t('arabic') : t('english')}</span>
        </button>
      </div>
    </aside>
  );
}
