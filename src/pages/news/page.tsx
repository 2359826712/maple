import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { latestNews } from '@/mocks/home';
import RealtimeStatus from '@/components/feature/RealtimeStatus';
import AuthRequiredNotice from '@/components/feature/AuthRequiredNotice';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { getNewsArticleCopy, getNewsCategoryLabel, getNewsCopy } from './localizedNews';

type NewsItem = (typeof latestNews)[number];
type LocalizedNewsItem = NewsItem & { categoryLabel: string };

const filters = ['All', 'Patch Notes', 'Event', 'General', 'Cash Shop'];

const tagStyle: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-800',
  accent: 'bg-accent-100 text-accent-800',
  secondary: 'bg-secondary-100 text-secondary-900',
};

const articleDetails: Record<string, { lead: string; sections: string[]; takeaway: string }> = {
  n1: {
    lead: 'This is a MapleHub summary of Nexon\'s official v.269 Ride the Lightning patch notes.',
    sections: [
      'The official indexed notice says the v.269 update arrived on June 17, 2026 and was updated on June 30.',
      'Highlighted items include New Job: Erel Light, SHINE: The Power of Starlight, and New Boss: Malefic Star.',
      'This page keeps only a short summary. Use the official Nexon source for complete event dates, patch details, and late edits.',
    ],
    takeaway: 'Read the official v.269 source before planning leveling, bossing, or event routes.',
  },
  n2: {
    lead: 'This is a MapleHub summary of Nexon\'s Challenger World and Burning Events notice.',
    sections: [
      'Nexon lists the Challenger World event period as June 17, 2026 after maintenance through September 8, 2026 at 11:59 PM UTC.',
      'The notice also covers Burning event participation, making it relevant for new characters and returning progression plans.',
      'Check the official post for level, world, and character restrictions before committing a character.',
    ],
    takeaway: 'Confirm the eligible world, event period, and participation rules before creating a new character.',
  },
  n3: {
    lead: 'This is a MapleHub summary of Nexon\'s compensation notice for the 6/20 unscheduled maintenance.',
    sections: [
      'The notice states that some Star Force enhancement costs were incorrectly deducted from players.',
      'Nexon says those incorrectly deducted costs will be restored during the June 25 maintenance.',
      'Players who enhanced during the affected window should review the official notice for eligibility details.',
    ],
    takeaway: 'If your Star Force costs were affected, check your account after the June 25 maintenance restoration.',
  },
  n4: {
    lead: 'This is a MapleHub summary of Nexon\'s notice about the 6/26 Accessory Miracle Time compensation.',
    sections: [
      'The notice explains compensation handling for the June 26 Accessory Miracle Time issue.',
      'Nexon specifically notes that cubes used after reaching Legendary rank are not eligible for compensation.',
      'If you participated in the affected Miracle Time window, use the official post to verify the compensation rules.',
    ],
    takeaway: 'Compensation depends on the rank-up attempt stage; post-Legendary cube use is excluded.',
  },
  n5: {
    lead: 'This is a MapleHub summary of Nexon\'s July 1 Cash Shop update.',
    sections: [
      'The official sale notice includes a permanent Songless Bird Mount.',
      'The notice also lists a new damage skin as part of the July 1 Cash Shop update.',
      'Always confirm sale period, item restrictions, and world availability in the official Nexon post before buying.',
    ],
    takeaway: 'Check the official sale notice before purchasing new mount or damage skin items.',
  },
};

export default function NewsPage() {
  const { t, i18n } = useTranslation();
  const { versionInfo } = useVersion();
  const [active, setActive] = useState('All');
  const [shared, setShared] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'saved' | 'unread'>('all');
  const [activeArticle, setActiveArticle] = useState<LocalizedNewsItem | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [authPrompt, setAuthPrompt] = useState(false);
  const { isSignedIn } = useAuthSession();
  const {
    items: realtimeNews,
    liveCount,
    lastSyncedAt,
    status: realtimeStatus,
    syncNow,
  } = useRealtimeCollection<NewsItem>({
    storageKey: 'maplehub-live-news',
    baseItems: latestNews,
    remoteUrl: '/realtime/news.json',
  });

  const versionList = useMemo(
    () =>
      realtimeNews
        .filter((n) => n.versions.includes(versionInfo.id))
        .map((n) => ({
          ...n,
          ...getNewsCopy(n, i18n.language),
          categoryLabel: getNewsCategoryLabel(n.category, i18n.language),
        })),
    [i18n.language, realtimeNews, versionInfo.id],
  );
  const counts = useMemo(
    () =>
      filters.reduce<Record<string, number>>((result, filter) => {
        result[filter] = filter === 'All' ? versionList.length : versionList.filter((n) => n.category === filter).length;
        return result;
      }, {}),
    [versionList],
  );

  const list = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let items = active === 'All' ? versionList : versionList.filter((n) => n.category === active);

    if (normalizedQuery) {
      items = items.filter((n) =>
        [n.title, n.excerpt, n.author, n.category, n.categoryLabel].some((value) => value.toLowerCase().includes(normalizedQuery)),
      );
    }

    if (viewMode === 'saved') {
      items = items.filter((n) => saved[n.id]);
    }

    if (viewMode === 'unread') {
      items = items.filter((n) => !read[n.id]);
    }

    return items;
  }, [active, query, read, saved, versionList, viewMode]);

  const share = async (article: LocalizedNewsItem, channel: string) => {
    const url = article.sourceUrl;
    try {
      await navigator.clipboard?.writeText(url);
    } catch {
      // Clipboard access can be blocked in some browser contexts; the in-app toast still confirms the action.
    }
    setShared(article.id + channel);
    setTimeout(() => setShared(null), 1500);
  };

  const openArticle = (article: LocalizedNewsItem) => {
    setActiveArticle(article);
    setRead((current) => ({ ...current, [article.id]: true }));
  };

  const toggleSaved = (article: LocalizedNewsItem) => {
    if (!isSignedIn) {
      setAuthPrompt(true);
      return;
    }

    setSaved((current) => ({ ...current, [article.id]: !current[article.id] }));
  };

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={3} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main className="pt-20 md:pt-24">
        <section className="py-14 md:py-20 bg-background-50">
          <div className="w-full px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
                  {t('news_title_eyebrow')}
                </div>
                <h1 className="mt-2 font-heading text-3xl md:text-5xl font-semibold text-foreground-950">
                  {t('news_title')}
                </h1>
                <p className="mt-3 text-foreground-600 max-w-xl">
                  {t('news_page_desc')}
                </p>
              </div>

              <div className="mb-6">
                <RealtimeStatus
                  status={realtimeStatus}
                  lastSyncedAt={lastSyncedAt}
                  liveCount={liveCount}
                  onRefresh={syncNow}
                />
              </div>
              {authPrompt && (
                <div className="mb-6">
                  <AuthRequiredNotice onDismiss={() => setAuthPrompt(false)} />
                </div>
              )}

              <div className="mb-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 items-start">
                <div className="min-w-0">
                  <div className="flex gap-1 bg-background-100 border border-background-200 rounded-full p-1 overflow-x-auto w-fit max-w-full">
                    {filters.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setActive(f)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          active === f
                            ? 'bg-primary-500 text-background-50'
                            : 'text-foreground-700 hover:text-primary-700'
                        }`}
                      >
                        {f === 'All' ? t('news_filter_all') : f === 'Patch Notes' ? t('news_filter_patch') : f === 'Event' ? t('news_filter_event') : f === 'General' ? t('news_filter_general') : t('news_filter_cash')}
                        <span className="ml-1 opacity-75">{counts[f]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="relative block">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-500 text-sm"></i>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={t('news_search_placeholder')}
                      className="w-full sm:w-64 h-10 rounded-full border border-background-200 bg-background-50 pl-9 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10"
                    />
                  </label>
                  <div className="flex gap-1 bg-background-100 border border-background-200 rounded-full p-1 w-fit">
                    {[
                      { key: 'all' as const, label: t('news_view_all') },
                      { key: 'saved' as const, label: t('news_view_saved') },
                      { key: 'unread' as const, label: t('news_view_unread') },
                    ].map((mode) => (
                      <button
                        key={mode.key}
                        type="button"
                        data-testid={`view-${mode.key}`}
                        onClick={() => setViewMode(mode.key)}
                        className={`px-3 py-2 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          viewMode === mode.key ? 'bg-foreground-900 text-background-50' : 'text-foreground-700 hover:text-primary-700'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {list.length === 0 ? (
                <div className="text-center py-20 text-foreground-600">
                  <i className="ri-newspaper-line text-5xl mb-4 block"></i>
                  <p className="text-lg font-semibold">{t('news_no_items', { version: versionInfo.shortLabel })}</p>
                  <p className="text-sm mt-1">{t('news_no_items_tip')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {list.map((n, i) => (
                    <article
                      key={n.id}
                      className={`group rounded-xl overflow-hidden border border-background-200 bg-background-50 flex flex-col ${
                        i === 0 ? 'lg:col-span-2 lg:row-span-1' : ''
                      }`}
                    >
                      <div className={`relative overflow-hidden ${i === 0 ? 'h-64 md:h-80' : 'h-44'}`}>
                        <img
                          src={n.image}
                          alt={n.title}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold ${tagStyle[n.tag]}`}>
                          {n.categoryLabel}
                        </span>
                        {n.versions.length === 1 && (
                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-foreground-900/70 text-background-50">
                            {n.versions[0].toUpperCase()}
                          </span>
                        )}
                        <div className="absolute bottom-3 right-3 flex gap-1.5">
                          {[
                            { icon: 'ri-twitter-x-line', channel: 'x' },
                            { icon: 'ri-facebook-fill', channel: 'facebook' },
                            { icon: 'ri-discord-line', channel: 'discord' },
                            { icon: 'ri-link', channel: 'link' },
                          ].map((shareItem) => (
                            <button
                              key={shareItem.channel}
                              type="button"
                              onClick={() => share(n, shareItem.channel)}
                              className="w-8 h-8 rounded-full bg-background-50/95 hover:bg-primary-500 hover:text-background-50 text-foreground-800 flex items-center justify-center cursor-pointer transition-colors"
                              aria-label={t('news_share_aria', { title: n.title, channel: shareItem.channel })}
                            >
                              <i className={shareItem.icon}></i>
                            </button>
                          ))}
                        </div>
                        {shared && shared.startsWith(n.id) && (
                          <div className="absolute bottom-14 right-3 px-3 py-1.5 rounded-md bg-foreground-900 text-background-50 text-xs">
                            {t('news_shared_toast')}
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className={`font-heading font-semibold text-foreground-950 ${i === 0 ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}`}>
                          {n.title}
                        </h3>
                        <p className="mt-2 text-sm text-foreground-700 flex-1">{n.excerpt}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            data-testid={`read-${n.id}`}
                            onClick={() => openArticle(n)}
                            className="h-9 px-4 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-semibold cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-book-open-line mr-1"></i>
                            {t('news_read_article')}
                          </button>
                          <button
                            type="button"
                            data-testid={`save-${n.id}`}
                            onClick={() => toggleSaved(n)}
                            className={`h-9 px-3 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                              saved[n.id]
                                ? 'bg-secondary-400 text-foreground-950'
                                : 'bg-background-100 hover:bg-secondary-100 text-foreground-800'
                            }`}
                          >
                            <i className={saved[n.id] ? 'ri-bookmark-fill mr-1' : 'ri-bookmark-line mr-1'}></i>
                            {saved[n.id] ? t('news_saved') : t('news_save')}
                          </button>
                          <button
                            type="button"
                            data-testid={`read-state-${n.id}`}
                            onClick={() => setRead((current) => ({ ...current, [n.id]: !current[n.id] }))}
                            className="h-9 px-3 rounded-full bg-background-100 hover:bg-primary-50 text-foreground-800 text-xs font-semibold cursor-pointer whitespace-nowrap"
                          >
                            <i className={read[n.id] ? 'ri-checkbox-circle-fill mr-1 text-primary-600' : 'ri-circle-line mr-1'}></i>
                            {read[n.id] ? t('news_read') : t('news_unread')}
                          </button>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-foreground-600">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center font-semibold text-[10px]">
                              {n.author[0]}
                            </div>
                            <span>{n.author}</span>
                            <span>·</span>
                            <span>{n.date}</span>
                          </div>
                          <span className="flex items-center gap-1">
                            <i className="ri-eye-line"></i>
                            {n.reads}
                          </span>
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

      {activeArticle && (
        <ArticleReader
          article={activeArticle}
          saved={!!saved[activeArticle.id]}
          read={!!read[activeArticle.id]}
          onClose={() => setActiveArticle(null)}
          onToggleSaved={() => toggleSaved(activeArticle)}
          onToggleRead={() => setRead((current) => ({ ...current, [activeArticle.id]: !current[activeArticle.id] }))}
          onShare={() => share(activeArticle, 'reader')}
          versionLabel={versionInfo.shortLabel}
        />
      )}

      <Footer />
    </div>
  );
}

function ArticleReader({
  article,
  saved,
  read,
  onClose,
  onToggleSaved,
  onToggleRead,
  onShare,
  versionLabel,
}: {
  article: LocalizedNewsItem;
  saved: boolean;
  read: boolean;
  onClose: () => void;
  onToggleSaved: () => void;
  onToggleRead: () => void;
  onShare: () => void;
  versionLabel: string;
}) {
  const { t, i18n } = useTranslation();
  const fallbackDetails = articleDetails[article.id] ?? {
    lead: article.excerpt,
    sections: [
      'This update is available in the current regional feed and is being tracked by MapleHub for quick planning.',
      'Use the category, version tag, and author metadata to decide whether this item affects your weekly routine.',
    ],
    takeaway: 'Check back after the next patch note update for more detail.',
  };
  const details = getNewsArticleCopy(article.id, i18n.language, fallbackDetails);

  return (
    <div className="fixed inset-0 z-50 bg-foreground-950/55 backdrop-blur-sm flex items-center justify-center p-4">
      <article className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-background-50 border border-primary-200/40 shadow-xl">
        <div className="relative h-56 md:h-72 overflow-hidden">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground-950/75 via-foreground-950/10 to-transparent"></div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-foreground-950/70 hover:bg-foreground-950 text-background-50 flex items-center justify-center cursor-pointer"
            aria-label={t('news_close_article')}
          >
            <i className="ri-close-line"></i>
          </button>
          <div className="absolute left-5 right-5 bottom-5">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${tagStyle[article.tag]}`}>
                {article.categoryLabel}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-background-50/95 text-foreground-900">
                {versionLabel}
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-4xl font-semibold text-background-50">{article.title}</h2>
          </div>
        </div>

        <div className="p-5 md:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-background-200 pb-5">
            <div className="flex items-center gap-3 text-sm text-foreground-700">
              <div className="w-9 h-9 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center font-semibold">
                {article.author[0]}
              </div>
              <div>
                <div className="font-semibold text-foreground-950">{article.author}</div>
                <div className="text-xs text-foreground-500">{article.date} · {article.reads} {t('news_reads')}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="reader-save"
                onClick={onToggleSaved}
                className={`h-9 px-4 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  saved ? 'bg-secondary-400 text-foreground-950' : 'bg-background-100 hover:bg-secondary-100 text-foreground-800'
                }`}
              >
                <i className={saved ? 'ri-bookmark-fill mr-1' : 'ri-bookmark-line mr-1'}></i>
                {saved ? t('news_saved') : t('news_save')}
              </button>
              <button
                type="button"
                data-testid="reader-read-state"
                onClick={onToggleRead}
                className="h-9 px-4 rounded-full bg-background-100 hover:bg-primary-50 text-foreground-800 text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <i className={read ? 'ri-checkbox-circle-fill mr-1 text-primary-600' : 'ri-circle-line mr-1'}></i>
                {read ? t('news_read') : t('news_unread')}
              </button>
              <button
                type="button"
                data-testid="reader-copy-link"
                onClick={onShare}
                className="h-9 px-4 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <i className="ri-link mr-1"></i>
                {t('news_copy_link')}
              </button>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="h-9 px-4 rounded-full bg-foreground-900 hover:bg-foreground-800 text-background-50 text-xs font-semibold cursor-pointer whitespace-nowrap inline-flex items-center"
              >
                <i className="ri-external-link-line mr-1"></i>
                {t('news_open_source')}
              </a>
            </div>
          </div>

          <p className="mt-6 text-lg leading-relaxed text-foreground-900">{details.lead}</p>
          <div className="mt-5 space-y-4">
            {details.sections.map((section) => (
              <p key={section} className="text-sm md:text-base leading-relaxed text-foreground-700">
                {section}
              </p>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-primary-200 bg-primary-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary-700">{t('news_takeaway')}</div>
            <p className="mt-1 text-sm leading-relaxed text-foreground-800">{details.takeaway}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
