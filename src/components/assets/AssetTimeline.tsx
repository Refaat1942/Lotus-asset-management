'use client';

import {
  Plus, Edit, UserCheck, RotateCcw, ArrowRightLeft, RefreshCw,
  Wrench, AlertTriangle, TrendingDown, MessageSquare, Upload,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { formatDateTime } from '@/lib/utils';

const eventIcons: Record<string, React.ElementType> = {
  CREATED: Plus,
  UPDATED: Edit,
  ASSIGNED: UserCheck,
  RETURNED: RotateCcw,
  TRANSFERRED: ArrowRightLeft,
  STATUS_CHANGED: RefreshCw,
  CONDITION_CHANGED: RefreshCw,
  MAINTENANCE: Wrench,
  ISSUE_REPORTED: AlertTriangle,
  DEPRECIATION: TrendingDown,
  NOTE_ADDED: MessageSquare,
  IMPORTED: Upload,
};

interface HistoryEvent {
  id: string;
  eventType: string;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  createdAt: string;
  createdBy?: { username: string } | null;
}

export function AssetTimeline({ events }: { events: HistoryEvent[] }) {
  const { t, locale } = useApp();

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-0 bottom-0 w-0.5 bg-slate-200" style={{ insetInlineStart: '1.25rem' }} />
      <div className="space-y-6">
        {events.map((event) => {
          const Icon = eventIcons[event.eventType] || Edit;
          const title = locale === 'ar' && event.titleAr ? event.titleAr : event.title;
          const description = locale === 'ar' && event.descriptionAr ? event.descriptionAr : event.description;

          return (
            <div key={event.id} className="relative flex gap-4 ps-10">
              <div className="absolute w-10 h-10 rounded-full bg-white border-2 border-lotus-200 flex items-center justify-center z-10"
                style={{ insetInlineStart: 0 }}>
                <Icon className="w-4 h-4 text-lotus-600" />
              </div>
              <div className="flex-1 premium-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-lotus-600 bg-lotus-50 px-2 py-0.5 rounded-full">
                        {t(`events.${event.eventType}`)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900">{title}</h4>
                    {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
                  </div>
                  <div className="text-end flex-shrink-0">
                    <p className="text-xs text-slate-400">{formatDateTime(event.createdAt, locale)}</p>
                    {event.createdBy && (
                      <p className="text-xs text-slate-400 mt-0.5">{event.createdBy.username}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
