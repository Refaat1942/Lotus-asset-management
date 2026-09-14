'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { NotificationToast } from '../ui/Notification';
import { SmartAssistant } from '../assistant/SmartAssistant';
import { useApp } from '@/contexts/AppContext';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    refreshUser().finally(() => setChecked(true));
  }, [refreshUser]);

  useEffect(() => {
    if (checked && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, pathname, router, checked]);

  if (!checked || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-lotus-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ms-64 min-h-screen">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto animate-in">
          {children}
        </div>
      </main>
      <NotificationToast />
      <SmartAssistant />
    </div>
  );
}
