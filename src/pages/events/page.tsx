import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import RealtimeStatus from '@/components/feature/RealtimeStatus';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { fetchLiveEvents, liveStorageKeys, type EventItem } from '@/services/liveContent';
import { daysUntilEventBoundary, formatServerDateRange, isAvailableInVersion } from '@/domain/regionModel';

const EVENT_REMINDERS_KEY = 'maplehub-event-reminders';

const readEventReminders = () => {
  try {
    const value = window.localStorage.getItem(EVENT_REMINDERS_KEY);
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
};

const rarityStyle: Record<string, string> = {
  Legendary: 'bg-primary-500 text-background-50',
  Seasonal: 'bg-accent-500 text-background-50',
  Weekly: 'bg-secondary-500 text-background-50',
};

export default function EventsPage() {
  const { t, i18n } = useTranslation();
  const { versionInfo } = useVersion();
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [reminders, setReminders] = useState<string[]>(readEventReminders);
  const {
    items: realtimeEvents,
    liveCount,
    lastSyncedAt,
    status: realtimeStatus,
    syncNow,
  } = useRealtimeCollection<EventItem>({
    storageKey: liveStorageKeys.events,
    baseItems: [],
    remoteLoader: fetchLiveEvents,
  });

  const filteredEvents = useMemo(
    () => realtimeEvents.filter((event) => isAvailableInVersion(event.regions, versionInfo.id)),
    [realtimeEvents, versionInfo.id],
  );
  const urgentEvents = useMemo(
    () => [...filteredEvents]
      .sort((a, b) => (
        daysUntilEventBoundary(a.windowStart, a.windowEnd) -
        daysUntilEventBoundary(b.windowStart, b.windowEnd)
      ))
      .slice(0, 3),
    [filteredEvents],
  );
  const eventWindow = (event: EventItem) =>
    formatServerDateRange(event.windowStart, event.windowEnd, versionInfo.id, i18n.language);
  const reminderId = (event: EventItem) => `${versionInfo.id}:${event.id}`;
  const hasReminder = (event: EventItem) => reminders.includes(reminderId(event));
  const toggleReminder = (event: EventItem) => {
    const id = reminderId(event);
    setReminders((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
      try { window.localStorage.setItem(EVENT_REMINDERS_KEY, JSON.stringify(next)); } catch { /* keep in memory */ }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-20 md:pt-24">
        <section className="py-14 md:py-20 bg-background-50">
          <div className="w-full px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                <div>
                  <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
                    {t('events_title_eyebrow')}
                  </div>
                  <h1 className="mt-2 font-heading text-3xl md:text-5xl font-semibold text-foreground-950">
                    {t('events_title')}
                  </h1>
                </div>
              </div>

              <div className="mb-6">
                <RealtimeStatus
                  status={realtimeStatus}
                  lastSyncedAt={lastSyncedAt}
                  liveCount={liveCount}
                  onRefresh={syncNow}
                />
              </div>

              {urgentEvents.length > 0 && (
                <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50/70 p-4">
                  <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-primary-700">
                        {t('events_verified_source')}
                      </div>
                      <h2 className="font-heading text-xl font-semibold text-foreground-950">
                        {t('events_latest_official')}
                      </h2>
                    </div>
                    <Link
                      to="/checklist"
                      className="inline-flex h-9 items-center justify-center rounded-full bg-primary-500 px-4 text-sm font-semibold text-background-50 hover:bg-primary-600"
                    >
                      <i className="ri-checkbox-circle-line mr-1.5"></i>
                      {t('nav_checklist')}
                    </Link>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {urgentEvents.map((eventItem) => (
                      <article key={eventItem.id} className="rounded-lg border border-background-200 bg-background-50 p-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                            <i className={eventItem.icon}></i>
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-foreground-950">{eventItem.name}</div>
                            <div className="truncate text-xs text-foreground-600">{eventWindow(eventItem)}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between rounded-md bg-background-100 px-3 py-2 text-xs">
                          <span className="text-foreground-600">{t('events_window')}</span>
                          <span className="font-semibold text-primary-700">{eventWindow(eventItem)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {filteredEvents.length === 0 ? (
                <div className="text-center py-20 text-foreground-600">
                  <i className={`${realtimeStatus === 'unavailable' && !lastSyncedAt ? 'ri-cloud-off-line' : 'ri-calendar-event-line'} text-5xl mb-4 block`}></i>
                  <p className="text-lg font-semibold">
                    {realtimeStatus === 'unavailable' && !lastSyncedAt
                      ? t('content_live_not_verified')
                      : t('events_no_items', { version: versionInfo.shortLabel })}
                  </p>
                  <p className="text-sm mt-1">
                    {realtimeStatus === 'unavailable' && !lastSyncedAt
                      ? t('content_live_no_success')
                      : t('events_no_items_tip')}
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
                          src={e.image}
                          alt={e.name}
                          className="w-full h-full object-cover object-top"
                        />
                        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold ${rarityStyle[e.rarity]}`}>
                          {e.rarity}
                        </span>
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-background-50/95 text-foreground-900 text-[11px] font-semibold">
                          <i className="ri-newspaper-line text-primary-600"></i>
                          {t('events_window')} {eventWindow(e)}
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
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveEvent(e)}
                            className="flex-1 h-10 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 dark:text-foreground-950 text-sm font-semibold cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-book-open-line mr-1"></i>
                            {t('events_open_details')}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleReminder(e)}
                            className={`h-10 w-10 rounded-md flex items-center justify-center transition ${
                              hasReminder(e)
                                ? 'bg-secondary-100 text-secondary-800'
                                : 'bg-background-100 text-foreground-800 hover:bg-secondary-100 hover:text-secondary-800'
                            }`}
                            aria-label={t(hasReminder(e) ? 'events_reminder_remove' : 'events_remind')}
                            title={t(hasReminder(e) ? 'events_reminder_remove' : 'events_remind')}
                          >
                            <i className={hasReminder(e) ? 'ri-notification-3-fill' : 'ri-notification-3-line'} />
                          </button>
                          <a
                              href={e.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="h-10 w-10 rounded-md bg-background-100 hover:bg-accent-100 hover:text-accent-700 text-foreground-800 flex items-center justify-center cursor-pointer"
                              aria-label={t('events_open_source')}
                            >
                              <i className="ri-external-link-line"></i>
                            </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {activeEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-950/55 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveEvent(null); }}
          onKeyDown={(e) => { if (e.key === 'Escape') setActiveEvent(null); }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          ref={(el) => { if (el) el.focus(); }}
        >
          <article className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-primary-200/40 bg-background-50 shadow-xl">
            <div className="relative h-52 overflow-hidden">
              <img src={activeEvent.image} alt={activeEvent.name} className="h-full w-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/75 to-transparent dark:from-[#120e0b]/75"></div>
              <button
                type="button"
                onClick={() => setActiveEvent(null)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-foreground-950/70 text-background-50 hover:bg-foreground-950"
                aria-label="Close"
              >
                <i className="ri-close-line"></i>
              </button>
              <div className="absolute bottom-4 left-5 right-5">
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${rarityStyle[activeEvent.rarity]}`}>
                    {activeEvent.rarity}
                  </span>
                  <span className="rounded-full bg-background-50/95 px-2.5 py-1 text-[11px] font-semibold text-foreground-900">
                    {activeEvent.sourceLabel}
                  </span>
                </div>
                <h2 className="font-heading text-2xl font-semibold text-background-50 md:text-3xl">{activeEvent.name}</h2>
              </div>
            </div>
            <div className="p-5 md:p-6">
              <div className="mb-4 rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm text-foreground-800">
                <i className="ri-shield-check-line mr-1.5 text-primary-700"></i>
                {t('events_timing_note')}
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-background-100 p-3">
                  <dt className="text-xs font-semibold uppercase text-foreground-500">{t('events_window')}</dt>
                  <dd className="mt-1 font-semibold text-foreground-950">{eventWindow(activeEvent)}</dd>
                </div>
                <div className="rounded-lg bg-background-100 p-3">
                  <dt className="text-xs font-semibold uppercase text-foreground-500">{t('events_verified_source')}</dt>
                  <dd className="mt-1 font-semibold text-foreground-950">{activeEvent.sourceLabel}</dd>
                </div>
              </dl>
              <div className="mt-4 rounded-lg bg-background-100 p-4 text-sm leading-relaxed text-foreground-800">
                <div className="mb-1 text-xs font-semibold uppercase text-foreground-500">{t('events_reward')}</div>
                {activeEvent.rewards.join(' · ') || t('events_reward_unlisted')}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleReminder(activeEvent)}
                  className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition ${
                    hasReminder(activeEvent)
                      ? 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200'
                      : 'border border-secondary-300 bg-background-50 text-secondary-800 hover:bg-secondary-50'
                  }`}
                >
                  <i className={`${hasReminder(activeEvent) ? 'ri-notification-3-fill' : 'ri-notification-3-line'} mr-1.5`} />
                  {t(hasReminder(activeEvent) ? 'events_reminder_saved' : 'events_remind')}
                </button>
                <a
                    href={activeEvent.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-primary-500 px-5 text-sm font-semibold text-background-50 hover:bg-primary-600"
                  >
                    {t('events_open_source')}
                    <i className="ri-external-link-line ml-1.5"></i>
                  </a>
                <span className="w-full text-xs text-foreground-500">{t('events_reminder_local')}</span>
              </div>
            </div>
          </article>
        </div>
      )}

      <Footer />
    </div>
  );
}
