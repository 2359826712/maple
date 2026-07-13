import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { isAvailableInVersion } from '@/domain/regionModel';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { fetchLiveNews, fetchLiveEvents, fetchLiveGuides, liveStorageKeys, type NewsItem, type EventItem, type GuideItem } from '@/services/liveContent';
import { getNewsCategoryLabel } from '@/pages/news/localizedNews';

export default function CurrentVersionHighlights() {
  const { t, i18n } = useTranslation();
  const { versionInfo } = useVersion();

  const { items: realtimeNews } = useRealtimeCollection<NewsItem>({
    storageKey: `${liveStorageKeys.news}:${versionInfo.id}`,
    baseItems: [],
    remoteLoader: fetchLiveNews,
  });
  const { items: realtimeEvents } = useRealtimeCollection<EventItem>({
    storageKey: `${liveStorageKeys.events}:${versionInfo.id}`,
    baseItems: [],
    remoteLoader: fetchLiveEvents,
  });
  const { items: realtimeGuides } = useRealtimeCollection<GuideItem>({
    storageKey: liveStorageKeys.guides,
    baseItems: [],
    remoteLoader: fetchLiveGuides,
  });

  const topNews = realtimeNews.find((item) => isAvailableInVersion(item.versions, versionInfo.id)) ?? null;
  const topEvent = realtimeEvents.find((item) => isAvailableInVersion(item.regions, versionInfo.id)) ?? null;
  const topEventNews = realtimeNews.find((item) => (
    item.category === 'Event' && isAvailableInVersion(item.versions, versionInfo.id)
  )) ?? null;
  const topGuide = realtimeGuides.find((item) => isAvailableInVersion(item.versions, versionInfo.id)) ?? null;

  const newsCard = topNews ? {
    kind: 'live' as const,
    icon: 'ri-newspaper-line',
    label: t('home_cv_latest_news'),
    title: topNews.title,
    sub: `${getNewsCategoryLabel(topNews.category, i18n.language)} · ${topNews.date}`,
    href: '/news',
    hrefLabel: t('home_cv_all_news'),
    image: topNews.image,
    sourceCue: undefined,
  } : {
    kind: 'fallback' as const,
    icon: 'ri-newspaper-line',
    title: t('home_cv_fallback_news'),
    href: '/news',
  };

  const eventCard = topEvent ? {
    kind: 'live' as const,
    icon: 'ri-calendar-event-line',
    label: t('home_cv_active_event'),
    title: topEvent.name,
    sub: `${new Date(topEvent.windowEnd).toLocaleDateString()} · ${topEvent.rewards.join(' · ')}`,
    href: '/events',
    hrefLabel: t('home_cv_all_events'),
    image: topEvent.image,
    sourceCue: undefined,
  } : topEventNews ? {
    kind: 'live' as const,
    icon: 'ri-calendar-event-line',
    label: t('events_latest_official'),
    title: topEventNews.title,
    sub: `${t('events_published')} · ${topEventNews.date}`,
    href: '/events',
    hrefLabel: t('home_cv_all_events'),
    image: topEventNews.image,
    sourceCue: undefined,
  } : {
    kind: 'fallback' as const,
    icon: 'ri-calendar-event-line',
    title: t('home_cv_fallback_events'),
    href: '/events',
  };

  const guideCard = topGuide ? {
    kind: 'live' as const,
    icon: 'ri-book-open-line',
    label: t('home_cv_top_guide'),
    title: topGuide.title,
    sub: `${topGuide.class} · ${topGuide.difficulty}`,
    sourceCue: t('home_cv_english_source', { source: topGuide.sourceLabel || 'Grandis Library' }),
    href: '/guides',
    hrefLabel: t('home_cv_all_guides'),
    image: topGuide.image,
  } : {
    kind: 'fallback' as const,
    icon: 'ri-book-open-line',
    title: t('home_cv_fallback_guides'),
    href: '/guides',
  };

  /*
   * Keep one destination per player intent. Live feeds fail independently, so a
   * guide should not suppress useful News and Events fallbacks (or vice versa).
   */
  const cards = [newsCard, eventCard, guideCard];

  return (
    <section className="py-10 md:py-14 bg-background-50">
      <div className="w-full px-4 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-flashlight-line text-primary-500 text-[10px]"></i>
              {versionInfo.shortLabel}
            </div>
            <h2 className="mt-1.5 font-heading text-xl md:text-2xl font-semibold text-foreground-950">
              {t('home_cv_title')}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => {
            if (card.kind === 'fallback') {
              return (
                <Link
                  key={card.href}
                  to={card.href}
                  className="group rounded-xl border border-dashed border-background-300 bg-background-100/60 p-5 transition hover:border-primary-300 hover:bg-primary-50/50"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-background-200 text-foreground-700">
                    <i className={`${card.icon} text-lg`} />
                  </div>
                  <h3 className="font-heading text-base font-semibold text-foreground-900">{card.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-foreground-600">{t('home_cv_fallback_desc')}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-700">
                    {t('home_cv_fallback_action')}
                    <i className="ri-arrow-right-s-line transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={card.href}
                to={card.href}
                className="group relative overflow-hidden rounded-xl border border-background-200 bg-background-50 transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
              >
              {card.image && (
                <div className="h-36 overflow-hidden">
                  <img
                    src={card.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-transparent to-background-50/80" />
                </div>
              )}
              <div className="relative p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-md bg-primary-100 text-primary-700 flex items-center justify-center">
                    <i className={`${card.icon} text-sm`}></i>
                  </div>
                  <span className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider">
                    {card.label}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-foreground-950 text-base leading-snug line-clamp-2">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-xs text-foreground-600 line-clamp-1">{card.sub}</p>
                {card.sourceCue && (
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-foreground-500">
                    <i className="ri-translate-2" aria-hidden="true" />
                    {card.sourceCue}
                  </p>
                )}
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 group-hover:text-primary-700">
                  {card.hrefLabel}
                  <i className="ri-arrow-right-s-line transition-transform group-hover:translate-x-0.5"></i>
                </div>
              </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
