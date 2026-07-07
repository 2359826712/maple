import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type RealtimeStatusType = 'idle' | 'syncing' | 'live';

interface RealtimeStatusProps {
  status: RealtimeStatusType;
  lastSyncedAt: string;
  liveCount: number;
  onRefresh: () => void;
}

export default function RealtimeStatus({
  status,
  lastSyncedAt,
  liveCount,
  onRefresh,
}: RealtimeStatusProps) {
  const { t, i18n } = useTranslation();
  const isSyncing = status === 'syncing';
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
    <div className="rounded-xl border border-primary-200 bg-primary-50/70 px-4 py-3 text-sm text-foreground-800">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-background-50">
              <span className={`h-1.5 w-1.5 rounded-full bg-background-50 ${isSyncing ? 'animate-pulse' : ''}`}></span>
              {isSyncing ? t('content_live_syncing') : t('content_live_badge')}
            </span>
            <span className="text-xs font-semibold text-primary-800">
              {t('content_live_items', { count: liveCount })}
            </span>
          </div>
          <p className="mt-1 text-xs text-foreground-600">
            {t('content_live_last_sync', { time: formattedTime })} · {t('content_live_auto')}
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
