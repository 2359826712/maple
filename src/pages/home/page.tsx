import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVersion, VersionProvider } from '@/hooks/VersionContext';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import QuickTools from './components/QuickTools';
import RankingBoard from './components/RankingBoard';
import NewsletterCTA from './components/NewsletterCTA';
import Footer from './components/Footer';
import NotificationDrawer from './components/NotificationDrawer';
import ThemeSwitcher from './components/ThemeSwitcher';
import { notifications, latestNews, trendingGuides, upcomingEvents, communityHighlights, wikiCategories } from '@/mocks/home';
import { wikiCategoryInfos, wikiEntries, type WikiCategory, type WikiEntry } from '@/mocks/wiki';
import { getGuideCardCopy } from '@/pages/guides/localizedGuides';
import { getNewsCategoryLabel, getNewsCopy } from '@/pages/news/localizedNews';

type NewsItem = (typeof latestNews)[number];
type GuideItem = (typeof trendingGuides)[number];
type EventItem = (typeof upcomingEvents)[number];

const wikiCategoryMap: Record<string, WikiCategory> = {
  Classes: 'classes',
  Bosses: 'bosses',
  'Items & Sets': 'items',
  'Maps & Regions': 'maps',
  'NPCs & Quests': 'npcs',
  Systems: 'systems',
};

function HighlightCard({ icon, title, items, viewAllHref, viewAllLabel }: {
  icon: string;
  title: string;
  items: { label: string; sub: string }[];
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <div className="rounded-xl border border-background-200 bg-background-50 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
          <i className={`${icon} text-lg`}></i>
        </div>
        <h3 className="font-heading font-semibold text-foreground-950 text-base">{title}</h3>
      </div>
      <div className="space-y-3 flex-1">
        {items.map((item) => (
          <Link
            key={item.label}
            to={viewAllHref}
            className="block p-3 rounded-lg bg-background-100 hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-colors cursor-pointer"
          >
            <div className="text-sm font-semibold text-foreground-900 leading-snug">{item.label}</div>
            <div className="text-[11px] text-foreground-600 mt-0.5">{item.sub}</div>
          </Link>
        ))}
      </div>
      <Link
        to={viewAllHref}
        className="mt-4 flex items-center justify-center gap-1 h-9 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-semibold cursor-pointer whitespace-nowrap"
      >
        {viewAllLabel}
        <i className="ri-arrow-right-line"></i>
      </Link>
    </div>
  );
}

function HighlightsSection() {
  const { t, i18n } = useTranslation();
  const { versionInfo } = useVersion();
  const { items: realtimeNews } = useRealtimeCollection<NewsItem>({
    storageKey: 'maplehub-live-news',
    baseItems: latestNews,
    remoteUrl: '/realtime/news.json',
  });
  const { items: realtimeGuides } = useRealtimeCollection<GuideItem>({
    storageKey: 'maplehub-live-guides',
    baseItems: trendingGuides,
    remoteUrl: '/realtime/guides.json',
  });
  const { items: realtimeEvents } = useRealtimeCollection<EventItem>({
    storageKey: 'maplehub-live-events',
    baseItems: upcomingEvents,
    remoteUrl: '/realtime/events.json',
  });
  const { items: realtimeWikiEntries } = useRealtimeCollection<WikiEntry>({
    storageKey: 'maplehub-live-wiki',
    baseItems: wikiEntries,
    remoteUrl: '/realtime/wiki.json',
  });
  const wikiCounts = useMemo(
    () =>
      realtimeWikiEntries.reduce<Record<WikiCategory, number>>((result, entry) => {
        result[entry.category] += 1;
        return result;
      }, {
        classes: 0,
        bosses: 0,
        items: 0,
        maps: 0,
        npcs: 0,
        systems: 0,
      }),
    [realtimeWikiEntries],
  );

  const verNews = realtimeNews.filter((n) => n.versions.includes(versionInfo.id)).slice(0, 4);
  const verGuides = realtimeGuides.filter((g) => g.versions.includes(versionInfo.id)).slice(0, 3);
  const verEvents = realtimeEvents.filter((e) => e.versions.includes(versionInfo.id)).slice(0, 3);
  const verCommunity = communityHighlights.slice(0, 3);
  const isZh = i18n.language.startsWith('zh');
  const wikiCategoryLabels = wikiCategoryInfos.reduce<Record<string, string>>((result, category) => {
    result[category.name] = isZh ? category.nameZh : category.name;
    return result;
  }, {});

  return (
    <section className="py-14 md:py-20 bg-background-100">
      <div className="w-full px-4 md:px-8">
        <div className="mb-8">
          <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
            <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
            {t('home_explore_eyebrow')}
          </div>
          <h2 className="mt-2 font-heading text-2xl md:text-4xl font-semibold text-foreground-950">
            {t('home_explore_title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <HighlightCard
              icon="ri-newspaper-line"
              title={t('news_title')}
              items={verNews.map((n) => {
                const copy = getNewsCopy(n, i18n.language);
                return { label: copy.title, sub: `${getNewsCategoryLabel(n.category, i18n.language)} · ${n.date}` };
              })}
              viewAllHref="/news"
              viewAllLabel={t('guides_browse_all')}
            />
          </div>
          <HighlightCard
            icon="ri-book-open-line"
            title={t('guides_title_eyebrow')}
            items={verGuides.map((g) => {
              const copy = getGuideCardCopy(g, i18n.language);
              return { label: copy.title, sub: `${copy.classLabel} · ${copy.difficulty}` };
            })}
            viewAllHref="/guides"
            viewAllLabel={t('guides_browse_all')}
          />
          <HighlightCard
            icon="ri-calendar-event-line"
            title={t('events_title_eyebrow')}
            items={verEvents.map((e) => ({ label: e.name, sub: `${e.window} · ${e.reward}` }))}
            viewAllHref="/events"
            viewAllLabel={t('events_calendar')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <HighlightCard
            icon="ri-chat-heart-line"
            title={t('community_title_eyebrow')}
            items={verCommunity.map((c) => ({ label: c.title, sub: `${c.user} · ${t('home_reactions', { count: c.reactions })}` }))}
            viewAllHref="/community"
            viewAllLabel={t('community_view_forum')}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="rounded-xl border border-background-200 bg-background-50 p-5 h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                  <i className="ri-database-2-line text-lg"></i>
                </div>
                <h3 className="font-heading font-semibold text-foreground-950 text-base">
                  {t('wiki_title_eyebrow')}
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {wikiCategories.map((c) => (
                  <Link
                    key={c.name}
                    to="/wiki"
                    className="p-3 rounded-lg bg-background-100 hover:bg-primary-50 border border-transparent hover:border-primary-200 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-md bg-background-50 text-primary-700 flex items-center justify-center">
                      <i className={`${c.icon} text-sm`}></i>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground-900">{wikiCategoryLabels[c.name] ?? c.name}</div>
                      <div className="text-[10px] text-foreground-600">
                        {(wikiCounts[wikiCategoryMap[c.name]] ?? c.count).toLocaleString()} {t('wiki_entries_suffix')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                to="/wiki"
                className="inline-flex items-center gap-1 mt-auto h-9 px-4 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                {t('wiki_browse')}
                <i className="ri-arrow-right-line"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeContent() {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar
        onOpenNotifications={() => setNotifOpen(true)}
        unread={notifications.length}
      />
      <main>
        <Hero />
        <QuickTools />
        <HighlightsSection />
        <RankingBoard />
        <NewsletterCTA />
      </main>
      <Footer />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
      <ThemeSwitcher />
    </div>
  );
}

export default function Home() {
  return (
    <VersionProvider>
      <HomeContent />
    </VersionProvider>
  );
}
