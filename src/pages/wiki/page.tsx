import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import RealtimeStatus from '@/components/feature/RealtimeStatus';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { wikiCategoryInfos, wikiEntries, type WikiCategory, type WikiEntry } from '@/mocks/wiki';

const tintMap: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-700',
  accent: 'bg-accent-100 text-accent-700',
  secondary: 'bg-secondary-100 text-secondary-900',
};

const categoryLabelMap: Record<string, string> = {
  primary: 'bg-primary-500 text-background-50 dark:text-foreground-950',
  accent: 'bg-accent-500 text-background-50 dark:text-foreground-950',
  secondary: 'bg-secondary-500 text-background-50 dark:text-foreground-950',
};

export default function WikiPage() {
  const { t, i18n } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<WikiCategory | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<WikiEntry | null>(null);
  const {
    items: realtimeWikiEntries,
    liveCount,
    lastSyncedAt,
    status: realtimeStatus,
    syncNow,
  } = useRealtimeCollection<WikiEntry>({
    storageKey: 'maplehub-live-wiki',
    baseItems: wikiEntries,
    remoteUrl: '/realtime/wiki.json',
  });

  const isZh = i18n.language.startsWith('zh');

  const filteredEntries = useMemo(() => {
    let entries = realtimeWikiEntries;
    if (activeCategory) {
      entries = entries.filter((e) => e.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.titleZh.includes(q) ||
          e.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          e.tagsZh.some((tag) => tag.includes(q)) ||
          e.description.toLowerCase().includes(q) ||
          e.descriptionZh.includes(q)
      );
    }
    return entries;
  }, [query, activeCategory, realtimeWikiEntries]);

  const totalCount = realtimeWikiEntries.length;
  const categoryCounts = useMemo(
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

  const getTitle = (e: WikiEntry) => {
    if (isZh) return e.titleZh;
    return e.title;
  };

  const getDesc = (e: WikiEntry) => {
    if (isZh) return e.descriptionZh;
    return e.description;
  };

  const getContent = (e: WikiEntry) => {
    if (isZh) return e.contentZh;
    return e.content;
  };

  const getTags = (e: WikiEntry) => {
    if (isZh) return e.tagsZh;
    return e.tags;
  };

  const getCategoryInfo = (key: WikiCategory) =>
    wikiCategoryInfos.find((c) => c.key === key)!;

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={3} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main className="pt-16 md:pt-20">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-500 via-primary-600 to-accent-700 text-background-50 dark:text-foreground-950">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-90 flex items-center gap-1.5">
                <i className="ri-leaf-fill text-secondary-300 text-[10px]"></i>
                {t('wiki_title_eyebrow')}
              </div>
              <h1 className="mt-3 font-heading text-3xl md:text-5xl font-bold">
                {totalCount.toLocaleString()} {t('wiki_title')}
              </h1>
              <p className="mt-3 text-sm md:text-base opacity-95 leading-relaxed">
                {t('wiki_desc')}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-2 bg-background-50 rounded-full p-1.5 max-w-lg">
                <div className="flex items-center gap-2 flex-1 pl-3">
                  <i className="ri-book-2-line text-primary-700"></i>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('wiki_search_placeholder')}
                    className="w-full h-9 bg-transparent text-sm text-foreground-900 placeholder:text-foreground-500 outline-none"
                  />
                </div>
                <button
                  onClick={() => setQuery('')}
                  className="h-10 px-4 rounded-full bg-foreground-950 text-background-50 text-sm font-semibold cursor-pointer whitespace-nowrap"
                >
                  {query ? t('wiki_search_btn') : t('wiki_search_btn')}
                </button>
              </div>
              <div className="mt-4 max-w-2xl text-foreground-900">
                <RealtimeStatus
                  status={realtimeStatus}
                  lastSyncedAt={lastSyncedAt}
                  liveCount={liveCount}
                  onRefresh={syncNow}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Category Cards */}
        <section className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {wikiCategoryInfos.map((c) => {
              const isActive = activeCategory === c.key;
              const allTint = categoryLabelMap[c.tint];
              return (
                <button
                  key={c.key}
                  onClick={() => setActiveCategory(isActive ? null : c.key)}
                  className={`group p-4 rounded-xl border transition-all text-left cursor-pointer ${
                    isActive
                      ? 'border-primary-400 bg-primary-50 shadow-sm'
                      : 'border-background-200 bg-background-50 hover:border-primary-300 hover:bg-primary-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isActive ? allTint : 'bg-background-100 group-hover:bg-background-50'
                      }`}
                    >
                      <i className={`${c.icon} ${isActive ? 'text-background-50 dark:text-foreground-950' : 'text-primary-700'}`}></i>
                    </div>
                  </div>
                  <div className="font-heading font-semibold text-foreground-950 text-sm">
                    {isZh ? c.nameZh : c.name}
                  </div>
                  <div className="text-xs text-foreground-500 mt-0.5">
                    {(categoryCounts[c.key] ?? c.count).toLocaleString()} {t('wiki_entries_suffix')}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Results */}
        <section className="max-w-6xl mx-auto px-4 md:px-8 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-foreground-950">
              {activeCategory
                ? `${isZh ? getCategoryInfo(activeCategory).nameZh : getCategoryInfo(activeCategory).name} — ${filteredEntries.length} ${t('wiki_entries_suffix')}`
                : `${t('wiki_search_btn')} — ${filteredEntries.length} ${t('wiki_entries_suffix')}`}
            </h2>
            {(query || activeCategory) && (
              <button
                onClick={() => { setQuery(''); setActiveCategory(null); }}
                className="text-sm text-primary-600 hover:text-primary-700 cursor-pointer flex items-center gap-1"
              >
                <i className="ri-close-line"></i>
                {t('wiki_clear_filters')}
              </button>
            )}
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-center py-16 bg-background-100 rounded-xl border border-background-200">
              <i className="ri-book-open-line text-4xl text-foreground-300 mb-3"></i>
              <p className="text-foreground-600">
                {t('wiki_no_results')}
              </p>
              <p className="text-sm text-foreground-400 mt-1">
                {t('wiki_no_results_tip')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((e) => {
                const catInfo = getCategoryInfo(e.category);
                const allTint = tintMap[catInfo.tint];
                const labelTint = categoryLabelMap[catInfo.tint];
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEntry(e)}
                    className="text-left p-5 rounded-xl border border-background-200 bg-background-50 hover:border-primary-300 hover:bg-primary-50/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-md ${allTint} flex items-center justify-center`}>
                          <i className={e.icon}></i>
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${labelTint}`}>
                          {isZh ? catInfo.nameZh : catInfo.name}
                        </span>
                      </div>
                      <i className="ri-arrow-right-up-line text-foreground-400 group-hover:text-primary-500 transition-colors"></i>
                    </div>
                    <h3 className="mt-3 font-heading font-semibold text-foreground-950 text-base group-hover:text-primary-700 transition-colors">
                      {getTitle(e)}
                    </h3>
                    <p className="mt-1.5 text-sm text-foreground-600 leading-relaxed line-clamp-2">
                      {getDesc(e)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {getTags(e).slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-background-100 text-foreground-600 border border-background-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    {e.versions.length < 6 && (
                      <div className="mt-2 text-[11px] text-foreground-500">
                        {t('wiki_versions_label')}
                        {e.versions.map((v) => v.toUpperCase()).join(', ')}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground-950/40 backdrop-blur-sm"
            onClick={() => setSelectedEntry(null)}
          ></div>
          <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center pointer-events-none">
            <div className="w-full md:w-full md:max-w-2xl md:mx-4 bg-background-50 rounded-t-2xl md:rounded-2xl border border-background-200 shadow-xl max-h-[85vh] md:max-h-[80vh] overflow-hidden pointer-events-auto flex flex-col">
              {/* Header */}
              <div className="px-6 py-5 border-b border-background-200 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${categoryLabelMap[getCategoryInfo(selectedEntry.category).tint]}`}>
                      {isZh ? getCategoryInfo(selectedEntry.category).nameZh : getCategoryInfo(selectedEntry.category).name}
                    </span>
                    {selectedEntry.versions.length < 6 && (
                      <span className="text-[10px] text-foreground-500">
                        {selectedEntry.versions.map((v) => v.toUpperCase()).join(', ')}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-heading font-bold text-foreground-950">
                    {getTitle(selectedEntry)}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="w-9 h-9 rounded-full bg-background-100 hover:bg-primary-50 flex items-center justify-center cursor-pointer flex-shrink-0"
                >
                  <i className="ri-close-line text-foreground-700"></i>
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 overflow-y-auto flex-1">
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {getTags(selectedEntry).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-background-100 text-foreground-700 border border-background-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-foreground-700 leading-relaxed mb-4">
                  {getDesc(selectedEntry)}
                </p>
                <div className="bg-background-100 rounded-xl p-4 border border-background-200">
                  <div className="text-xs font-semibold text-foreground-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
                    {t('wiki_details')}
                  </div>
                  <p className="text-sm text-foreground-800 leading-relaxed whitespace-pre-line">
                    {getContent(selectedEntry)}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-background-200 flex gap-2">
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="flex-1 h-10 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 dark:text-foreground-950 text-sm font-semibold cursor-pointer whitespace-nowrap"
                >
                  {t('community_close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
