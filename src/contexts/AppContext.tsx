'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, t, getDirection } from '@/lib/i18n';
import { ALL_PERMISSIONS } from '@/lib/guest-user';

interface User {
  id: string;
  username: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  canChangeUsername: boolean;
}

interface AppContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
  user: User | null;
  setUser: (user: User | null) => void;
  companyLogo: string | null;
  setCompanyLogo: (logo: string | null) => void;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
  notify: (message: string, type?: 'success' | 'error') => void;
  notification: { message: string; type: 'success' | 'error' } | null;
  clearNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const OPEN_ACCESS_USER: User = {
  id: 'system',
  username: 'System',
  roleId: 'open-access',
  roleName: 'Open Access',
  permissions: ALL_PERMISSIONS,
  canChangeUsername: false,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [user, setUser] = useState<User | null>(OPEN_ACCESS_USER);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'ar')) {
      setLocaleState(savedLocale);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = getDirection(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  }, []);

  const translate = useCallback((key: string) => t(locale, key), [locale]);

  const hasPermission = useCallback(() => true, []);

  const refreshUser = useCallback(async () => {
    setUser(OPEN_ACCESS_USER);
  }, []);

  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const clearNotification = useCallback(() => setNotification(null), []);

  useEffect(() => {
    refreshUser();
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.logo) setCompanyLogo(data.logo);
      })
      .catch(() => {});
  }, [refreshUser]);

  return (
    <AppContext.Provider
      value={{
        locale,
        setLocale,
        t: translate,
        dir: getDirection(locale),
        user,
        setUser,
        companyLogo,
        setCompanyLogo,
        hasPermission,
        refreshUser,
        notify,
        notification,
        clearNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
