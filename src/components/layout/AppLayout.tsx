'use client';

import { Sidebar } from './Sidebar';
import { NotificationToast } from '../ui/Notification';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ms-64 min-h-screen">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto animate-in">
          {children}
        </div>
      </main>
      <NotificationToast />
    </div>
  );
}
