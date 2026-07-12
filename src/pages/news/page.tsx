import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { isAvailableInVersion } from '@/domain/regionModel';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import RealtimeStatus from '@/components/feature/RealtimeStatus';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { getNewsCategoryLabel, getNewsCopy } from './localizedNews';
import { fetchLiveNews, liveStorageKeys, type NewsItem } from '@/services/liveContent';
import { readJson, writeJsonWithRecovery } from '@/services/persistentStorage';

type LocalizedNewsItem = NewsItem & { categoryLabel: string };

const filters = ['All', 'Patch Notes', 'Event', 'General', 'Cash Shop'];

const tagStyle: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-800',
  accent: 'bg-accent-100 text-accent-800',
  secondary: 'bg-secondary-100 text-secondary-900',
};

const fallbackNewsImage = 'https://nxcache.nexon.net/cms/2021/q1/2167/maintenance-1100x225-maplestory.png';

const applyNewsImageFallback = (event: SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'true') {
    image.style.display = 'none';
    return;
  }

  image.dataset.fallbackApplied = 'true';
  image.src = fallbackNewsImage;
};

const NEWS_STATE_KEY = 'maplehub-news-state:v1';

type NewsState = {
  saved: Record<string, boolean>;
  read: Record<string, boolean>;
};

const loadNewsState = (): NewsState => {
  try {
    const value = readJson<Partial<NewsState>>(window.localStorage, NEWS_STATE_KEY);
    return {
      saved: value?.saved && typeof value.saved === 'object' ? value.saved : {},
      read: value?.read && typeof value.read === 'object' ? value.read : {},
    };
  } catch {
    return { saved: {}, read: {} };
  }
};

export default function NewsPage() {
  const { t, i18n } = useTranslation();
  const { versionInfo } = useVersion();
  const [searchParams] = useSearchParams();
  const [active, setActive] = useState('All');
  const [shared, setShared] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [viewMode, setViewMode] = useState<'all' | 'saved' | 'unread'>('all');
  const [initialNewsState] = useState(loadNewsState);
  const [saved, setSaved] = useState<Record<string, boolean>>(initialNewsState.saved);
  const [read, setRead] = useState<Record<string, boolean>>(initialNewsState.read);
  const [storageError, setStorageError] = useState(false);
  const {
    items: realtimeNews,
    liveCount,
    lastSyncedAt,
    status: realtimeStatus,
    syncNow,
  } = useRealtimeCollection<NewsItem>({
    storageKey: liveStorageKeys.news,
    baseItems: [],
    remoteLoader: fetchLiveNews,
  });

  const versionList = useMemo(
    () =>
      realtimeNews
        .filter((item) => isAvailableInVersion(item.versions, versionInfo.id))
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

  useEffect(() => {
    const result = writeJsonWithRecovery(window.localStorage, NEWS_STATE_KEY, { saved, read });
    setStorageError(!result.ok);
  }, [read, saved]);

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

  const markArticleRead = (article: LocalizedNewsItem) => {
    setRead((current) => ({ ...current, [article.id]: true }));
  };

  const toggleSaved = (article: LocalizedNewsItem) => {
    setSaved((current) => ({ ...current, [article.id]: !current[article.id] }));
  };

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-20 md:pt-24">
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
              {storageError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="status" aria-live="polite">
                  {t('news_storage_error', { defaultValue: 'News state could not be saved locally. Existing data was not deleted.' })}
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
                          src={n.image || fallbackNewsImage}
                          alt={n.title}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          onError={applyNewsImageFallback}
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
                          <button
                            type="button"
                            onClick={() => share(n, 'link')}
                            className="w-8 h-8 rounded-full bg-background-50/95 hover:bg-primary-500 hover:text-background-50 text-foreground-800 flex items-center justify-center cursor-pointer transition-colors"
                            aria-label={t('news_share_aria', { title: n.title, channel: 'link' })}
                          >
                            <i className="ri-link"></i>
                          </button>
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
                          <a
                            data-testid={`read-${n.id}`}
                            href={n.sourceUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            onClick={() => markArticleRead(n)}
                            className="h-9 px-4 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-semibold cursor-pointer whitespace-nowrap"
                          >
                            <i className="ri-book-open-line mr-1"></i>
                            {t('news_read_article')}
                          </a>
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

      <Footer />
    </div>
  );
}
