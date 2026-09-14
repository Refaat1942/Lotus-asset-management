'use client';

import { useApp } from '@/contexts/AppContext';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NotificationToast() {
  const { notification, clearNotification } = useApp();

  if (!notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in" style={{ insetInlineEnd: '1rem' }}>
      <div
        className={cn(
          'flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-elevated border',
          isSuccess ? 'bg-white border-emerald-200' : 'bg-white border-red-200'
        )}
      >
        {isSuccess ? (
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        )}
        <span className="text-sm font-medium text-slate-700">{notification.message}</span>
        <button onClick={clearNotification} className="p-1 hover:bg-slate-100 rounded-lg">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
