import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { wikiCategories, recommendations } from '@/mocks/home';
import { wikiEntries, type WikiCategory, type WikiEntry } from '@/mocks/wiki';

const tintMap: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-700',
  accent: 'bg-accent-100 text-accent-700',
  secondary: 'bg-secondary-100 text-secondary-900',
};

const recommendationHref: Record<string, string> = {
  Guide: '/guides/g1',
  Event: '/events',
  Wiki: '/wiki',
  Video: '/community',
};

const categoryNameMap: Record<string, WikiCategory> = {
  Classes: 'classes',
  Bosses: 'bosses',
  'Items & Sets': 'items',
  'Maps & Regions': 'maps',
  'NPCs & Quests': 'npcs',
  Systems: 'systems',
};

export default function WikiAndRecommendations() {
  const { t } = useTranslation();
  const { versionInfo } = useVersion();
  const { items: realtimeWikiEntries } = useRealtimeCollection<WikiEntry>({
    storageKey: 'maplehub-live-wiki',
    baseItems: wikiEntries,
    remoteUrl: '/realtime/wiki.json',
  });
  const wikiStats = useMemo(
    () =>
      realtimeWikiEntries.reduce(
        (result, entry) => {
          result.total += 1;
          result.categories[entry.category] += 1;
          return result;
        },
        {
          total: 0,
          categories: {
            classes: 0,
            bosses: 0,
            items: 0,
            maps: 0,
            npcs: 0,
            systems: 0,
          } as Record<WikiCategory, number>,
        },
      ),
    [realtimeWikiEntries],
  );

  return (
    <section id="wiki" className="py-14 md:py-20 bg-background-50">
      <div className="w-full px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wiki - takes 2 cols */}
          <div className="lg:col-span-2 rounded-xl border border-background-200 overflow-hidden">
            <div className="relative p-6 md:p-8 bg-primary-500 text-background-50 dark:text-foreground-950">
              <div className="max-w-lg relative z-10">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-90 flex items-center gap-1.5">
                  <i className="ri-leaf-fill text-secondary-300 text-[10px]"></i>
                  {t('wiki_title_eyebrow')}
                </div>
                <h2 className="mt-2 font-heading text-2xl md:text-4xl font-semibold">
                  {wikiStats.total.toLocaleString()} {t('wiki_title')}
                </h2>
                <p className="mt-3 text-sm md:text-base opacity-95">
                  {t('wiki_desc')}
                </p>
                <div className="mt-5 flex flex-col sm:flex-row gap-2 bg-background-50 rounded-full p-1.5 max-w-md">
                  <div className="flex items-center gap-2 flex-1 pl-3">
                    <i className="ri-book-2-line text-primary-700"></i>
                    <input
                      placeholder={t('wiki_search_placeholder')}
                      className="w-full h-9 bg-transparent text-sm text-foreground-900 placeholder:text-foreground-500 outline-none"
                    />
                  </div>
                  <button className="h-10 px-4 rounded-full bg-foreground-950 text-background-50 text-sm font-semibold cursor-pointer whitespace-nowrap">
                    {t('wiki_search_btn')}
                  </button>
                </div>
              </div>
              <div className="absolute right-6 top-6 hidden md:flex flex-col items-end gap-2 opacity-95">
                <div className="w-16 h-16 rounded-full bg-background-50/25 backdrop-blur flex items-center justify-center animate-float">
                  <i className="ri-book-open-line text-3xl"></i>
                </div>
              </div>
            </div>

            <div className="p-5 bg-background-50">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {wikiCategories.map((c) => (
                  <a
                    key={c.name}
                    href="/wiki"
                    className="group p-4 rounded-lg bg-background-100 border border-background-200 hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-background-50 group-hover:bg-primary-100 text-primary-700 flex items-center justify-center">
                        <i className={`${c.icon} text-lg`}></i>
                      </div>
                      <div>
                        <div className="font-heading font-semibold text-foreground-950 text-sm">
                          {c.name}
                        </div>
                        <div className="text-xs text-foreground-600">
                          {(wikiStats.categories[categoryNameMap[c.name]] ?? c.count).toLocaleString()} {t('wiki_entries_suffix')}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Personalized recommendations */}
          <div className="rounded-xl border border-background-200 bg-background-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-semibold text-secondary-700 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="ri-leaf-fill text-secondary-600 text-[10px]"></i>
                  {t('rec_title_eyebrow')}
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground-950 mt-1">
                  {t('rec_title')}
                </h3>
                <p className="text-xs text-foreground-600 mt-0.5">
                  {t('rec_based_on')}
                </p>
              </div>
              <span className="w-10 h-10 rounded-lg bg-secondary-500 text-background-50 flex items-center justify-center">
                <i className="ri-sparkling-2-line text-lg"></i>
              </span>
            </div>

            <div className="space-y-3">
              {recommendations.map((r) => (
                <a
                  key={r.title}
                  href={recommendationHref[r.kind] ?? '/guides'}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background-100 hover:bg-secondary-50 hover:border-secondary-200 border border-transparent transition-colors cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-lg ${tintMap[r.tint]} flex items-center justify-center`}>
                    <i className={r.icon}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-foreground-500 uppercase tracking-wider">
                      {r.kind}
                    </div>
                    <div className="text-sm text-foreground-900 leading-snug">{r.title}</div>
                  </div>
                  <i className="ri-arrow-right-s-line text-foreground-500"></i>
                </a>
              ))}
            </div>

            <button className="mt-4 w-full h-10 rounded-md bg-secondary-500 hover:bg-secondary-600 text-background-50 dark:text-foreground-950 text-sm font-semibold cursor-pointer whitespace-nowrap">
              {t('rec_update_prefs')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
