'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Building2, MapPin, Users, UserCircle, Shield,
  FileSpreadsheet, BarChart3, Settings, LogOut, Globe,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { PERMISSIONS } from '@/lib/permissions';
import { CompanyLogo } from '@/components/ui/CompanyLogo';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'dashboard', permission: null },
  { href: '/assets', icon: Package, label: 'assets', permission: PERMISSIONS.VIEW_ASSETS },
  { href: '/persons', icon: UserCircle, label: 'persons', permission: PERMISSIONS.VIEW_ASSETS },
  { href: '/departments', icon: Building2, label: 'departments', permission: PERMISSIONS.MANAGE_DEPARTMENTS },
  { href: '/branches', icon: MapPin, label: 'branches', permission: PERMISSIONS.MANAGE_BRANCHES },
  { href: '/users', icon: Users, label: 'users', permission: PERMISSIONS.MANAGE_USERS },
  { href: '/authorization', icon: Shield, label: 'authorization', permission: PERMISSIONS.MANAGE_AUTHORIZATION },
  { href: '/import', icon: FileSpreadsheet, label: 'import', permission: PERMISSIONS.IMPORT_EXCEL },
  { href: '/reports', icon: BarChart3, label: 'reports', permission: PERMISSIONS.VIEW_REPORTS },
  { href: '/settings', icon: Settings, label: 'settings', permission: PERMISSIONS.MANAGE_SETTINGS },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t, hasPermission, companyLogo, locale, setLocale, user } = useApp();
  const [logoFailed, setLogoFailed] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  };

  return (
    <aside className="fixed top-0 bottom-0 w-64 bg-white border-e border-slate-100 flex flex-col z-40"
      style={{ insetInlineStart: 0 }}>
      <div className="p-6 border-b border-slate-100">
        <div className="space-y-3">
          {companyLogo && !logoFailed ? (
            <CompanyLogo
              src={companyLogo}
              size="md"
              className="max-w-full"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-header flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-bold text-slate-900 text-sm leading-tight">{t('appName')}</h1>
            </div>
          )}
          {user && <p className="text-xs text-slate-400">{user.username}</p>}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) return null;
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

      <div className="p-4 border-t border-slate-100 space-y-1">
        <button onClick={toggleLanguage} className="nav-link w-full">
          <Globe className="w-5 h-5" />
          <span>{locale === 'en' ? t('arabic') : t('english')}</span>
        </button>
        <button onClick={handleLogout} className="nav-link w-full text-red-600 hover:bg-red-50 hover:text-red-700">
          <LogOut className="w-5 h-5" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
}
