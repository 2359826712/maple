import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import RealtimeStatus from '@/components/feature/RealtimeStatus';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { upcomingEvents } from '@/mocks/home';

type EventItem = (typeof upcomingEvents)[number];

const rarityStyle: Record<string, string> = {
  Legendary: 'bg-primary-500 text-background-50',
  Seasonal: 'bg-accent-500 text-background-50',
  Weekly: 'bg-secondary-500 text-background-50',
};

export default function EventsPage() {
  const { t } = useTranslation();
  const { versionInfo } = useVersion();
  const [notifOpen, setNotifOpen] = useState(false);
  const {
    items: realtimeEvents,
    liveCount,
    lastSyncedAt,
    status: realtimeStatus,
    syncNow,
  } = useRealtimeCollection<EventItem>({
    storageKey: 'maplehub-live-events',
    baseItems: upcomingEvents,
    remoteUrl: '/realtime/events.json',
  });

  const filteredEvents = useMemo(
    () => realtimeEvents.filter((e) => e.versions.includes(versionInfo.id)),
    [realtimeEvents, versionInfo.id],
  );

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={3} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main className="pt-20 md:pt-24">
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
                <button className="hidden md:inline-flex h-10 px-4 rounded-full bg-background-100 border border-background-200 hover:border-accent-400 text-sm font-semibold text-foreground-800 cursor-pointer whitespace-nowrap">
                  <i className="ri-calendar-2-line mr-1"></i>
                  {t('events_calendar')}
                </button>
              </div>

              <div className="mb-6">
                <RealtimeStatus
                  status={realtimeStatus}
                  lastSyncedAt={lastSyncedAt}
                  liveCount={liveCount}
                  onRefresh={syncNow}
                />
              </div>

              {filteredEvents.length === 0 ? (
                <div className="text-center py-20 text-foreground-600">
                  <i className="ri-calendar-event-line text-5xl mb-4 block"></i>
                  <p className="text-lg font-semibold">{t('events_no_items', { version: versionInfo.shortLabel })}</p>
                  <p className="text-sm mt-1">{t('events_no_items_tip')}</p>
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
                          <i className="ri-timer-line text-primary-600"></i>
                          {t('events_starts_in')} {e.days} {t('events_days')}
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                            <i className={`${e.icon} text-xl`}></i>
                          </div>
                          <div>
                            <h3 className="font-heading font-semibold text-foreground-950 text-lg">{e.name}</h3>
                            <div className="text-xs text-foreground-600">{e.window}</div>
                          </div>
                        </div>
                        <div className="mt-4 p-3 rounded-lg bg-background-100 flex items-center gap-2 text-sm text-foreground-800">
                          <i className="ri-gift-2-line text-secondary-700"></i>
                          <span>{t('events_reward')} · <span className="font-semibold text-foreground-900">{e.reward}</span></span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button className="flex-1 h-10 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 dark:text-foreground-950 text-sm font-semibold cursor-pointer whitespace-nowrap">
                            <i className="ri-notification-line mr-1"></i>
                            {t('events_remind')}
                          </button>
                          <button className="h-10 w-10 rounded-md bg-background-100 hover:bg-accent-100 hover:text-accent-700 text-foreground-800 flex items-center justify-center cursor-pointer" aria-label="share">
                            <i className="ri-share-line"></i>
                          </button>
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

      <Footer />
    </div>
  );
}
