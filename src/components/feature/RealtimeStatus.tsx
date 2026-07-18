import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { RealtimeStatus as RealtimeStatusType } from '@/hooks/useRealtimeCollection';

interface RealtimeStatusProps {
  status: RealtimeStatusType;
  lastSyncedAt: string;
  liveCount: number;
  onRefresh: () => void;
  updateFrequency?: 'standard' | 'fast';
}

export default function RealtimeStatus({
  status,
  lastSyncedAt,
  liveCount,
  onRefresh,
  updateFrequency = 'fast',
}: RealtimeStatusProps) {
  const { t, i18n } = useTranslation();
  const isSyncing = status === 'syncing';
  const isCached = status === 'cached';
  const isUnavailable = status === 'unavailable';
  const badgeKey = updateFrequency === 'fast' ? 'content_live_badge_fast' : 'content_live_badge';
  const autoKey = updateFrequency === 'fast' ? 'content_live_auto_fast' : 'content_live_auto';
  const formattedTime = useMemo(() => {
    const date = new Date(lastSyncedAt);
    if (Number.isNaN(date.getTime())) return '--:--:--';

    return new Intl.DateTimeFormat(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }, [i18n.language, lastSyncedAt]);

  return (
    <div aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm text-foreground-800 ${isUnavailable ? 'border-accent-200 bg-accent-50/70' : isCached ? 'border-background-300 bg-background-100' : 'border-primary-200 bg-primary-50/70'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-background-50 ${isUnavailable ? 'bg-accent-600' : isCached ? 'bg-foreground-700' : 'bg-primary-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full bg-background-50 ${isSyncing ? 'animate-pulse' : ''}`}></span>
              {isSyncing
                ? t('content_live_syncing')
                : isUnavailable
                  ? t('content_live_unavailable')
                  : isCached
                    ? t('content_live_cached')
                    : t(badgeKey)}
            </span>
            <span className="text-xs font-semibold text-primary-800">
              {isUnavailable
                ? t('content_live_not_verified')
                : isCached
                  ? t('content_live_cached_desc')
                : isSyncing && liveCount === 0
                ? t('content_live_loading_items')
                : t('content_live_items', { count: liveCount })}
            </span>
          </div>
          <p className="mt-1 text-xs text-foreground-600">
            {isUnavailable && !lastSyncedAt
              ? t('content_live_no_success')
              : `${t('content_live_last_sync', { time: formattedTime })} · ${t(autoKey)}`}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="h-9 px-3 rounded-full bg-background-50 hover:bg-primary-100 border border-primary-200 text-xs font-semibold text-primary-800 cursor-pointer whitespace-nowrap"
        >
          <i className={`ri-refresh-line mr-1 ${isSyncing ? 'animate-spin' : ''}`}></i>
          {t('content_live_refresh')}
        </button>
      </div>
    </div>
  );
}
