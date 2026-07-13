import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useVersion } from '@/hooks/VersionContext';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { fetchLiveEvents, getRegionalContentImage, liveStorageKeys, officialArticleHref, type EventItem } from '@/services/liveContent';
import { applyRegionalImageFallback } from '@/components/feature/regionalImageFallback';
import {
  daysUntilEventBoundary,
  formatServerDateRange,
  isAvailableInVersion,
} from '@/domain/regionModel';

const rarityStyle: Record<string, string> = {
  Legendary: 'bg-primary-500 text-background-50',
  Seasonal: 'bg-accent-500 text-background-50',
  Weekly: 'bg-secondary-500 text-background-50',
};

export default function EventsPreview() {
  const { t, i18n } = useTranslation();
  const { versionInfo } = useVersion();
  const loadEvents = useCallback(() => fetchLiveEvents(versionInfo.id), [versionInfo.id]);
  const { items: realtimeEvents, status, lastSyncedAt } = useRealtimeCollection<EventItem>({
    storageKey: `${liveStorageKeys.events}:${versionInfo.id}`,
    baseItems: [],
    remoteLoader: loadEvents,
  });

  const filteredEvents = useMemo(
    () => realtimeEvents.filter((event) => isAvailableInVersion(event.regions, versionInfo.id)),
    [realtimeEvents, versionInfo.id],
  );
  const eventWindow = (event: EventItem) =>
    formatServerDateRange(event.windowStart, event.windowEnd, versionInfo.id, i18n.language);

  return (
    <section id="events" className="py-14 md:py-20 bg-background-100">
      <div className="w-full px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
              {t('events_title_eyebrow')}
            </div>
            <h2 className="mt-2 font-heading text-2xl md:text-4xl font-semibold text-foreground-950">
              {t('events_title')}
            </h2>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-foreground-600">
            <i className={`${status === 'unavailable' && !lastSyncedAt ? 'ri-cloud-off-line' : 'ri-calendar-event-line'} text-4xl mb-3 block`}></i>
            <p className="text-lg font-semibold">
              {status === 'unavailable' && !lastSyncedAt
                ? t('content_live_not_verified')
                : t('events_no_items', { version: versionInfo.shortLabel })}
            </p>
            <p className="text-sm mt-1">
              {status === 'unavailable' && !lastSyncedAt ? t('content_live_no_success') : t('events_no_items_tip')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {filteredEvents.map((e) => (
              <article
                key={e.id}
                className="rounded-xl overflow-hidden border border-background-200 bg-background-50 flex flex-col"
              >
                <div className="relative h-40 md:h-44">
                  <img
                    src={getRegionalContentImage(e.image, versionInfo.id)}
                    alt={e.name}
                    className="w-full h-full object-cover object-top"
                    onError={(event) => applyRegionalImageFallback(event.currentTarget, versionInfo.id)}
                  />
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold ${rarityStyle[e.rarity]}`}>
                    {e.rarity}
                  </span>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-background-50/95 text-foreground-900 text-[11px] font-semibold">
                    <i className="ri-timer-line text-primary-600"></i>
                    {Date.now() < Date.parse(e.windowStart) ? t('events_starts_in') : t('events_ends_in')}{' '}
                    {daysUntilEventBoundary(e.windowStart, e.windowEnd)} {t('events_days')}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                      <i className={`${e.icon} text-xl`}></i>
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground-950 text-lg">{e.name}</h3>
                      <div className="text-xs text-foreground-600">{eventWindow(e)}</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-background-100 flex items-center gap-2 text-sm text-foreground-800">
                    <i className="ri-gift-2-line text-secondary-700"></i>
                    <span>{t('events_reward')} · <span className="font-semibold text-foreground-900">{e.rewards.join(' · ') || t('events_reward_unlisted')}</span></span>
                  </div>
                  <Link
                    to={officialArticleHref(e.sourceUrl, e.name, versionInfo.id)}
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary-500 px-4 text-sm font-semibold text-background-50 hover:bg-primary-600"
                  >
                    {t('events_open_source')}
                    <i className="ri-book-open-line ml-1.5"></i>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
