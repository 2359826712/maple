import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import {
  communityToolRegions,
  communityTools,
  type CommunityToolCategory,
} from '@/mocks/communityTools';
import {
  filterCommunityTools,
  type CommunityToolServerFilter,
} from '@/domain/communityToolCatalog';
import { telemetry } from '@/services/telemetry';

const categories: ReadonlyArray<{
  key: CommunityToolCategory | 'all';
  icon: string;
}> = [
  { key: 'all', icon: 'ri-apps-line' },
  { key: 'calculator', icon: 'ri-calculator-line' },
  { key: 'database', icon: 'ri-database-2-line' },
  { key: 'simulator', icon: 'ri-gamepad-line' },
  { key: 'tracker', icon: 'ri-line-chart-line' },
  { key: 'utility', icon: 'ri-tools-line' },
  { key: 'guide', icon: 'ri-book-open-line' },
  { key: 'community', icon: 'ri-chat-3-line' },
  { key: 'official', icon: 'ri-government-line' },
];

export default function ToolsPage() {
  const { t, i18n } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CommunityToolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [serverFilter, setServerFilter] = useState<CommunityToolServerFilter>('all');
  const useChineseCopy = (i18n.resolvedLanguage ?? i18n.language).toLowerCase().startsWith('zh');

  const filteredTools = useMemo(
    () => filterCommunityTools(communityTools, serverFilter, activeCategory, searchQuery),
    [activeCategory, searchQuery, serverFilter],
  );

  const selectedServer = communityToolRegions.find((region) => region.code === serverFilter);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-950">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
          <div className="mb-6 max-w-3xl">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
              {t('tools_page_eyebrow')}
            </div>
            <h1 className="font-serif text-3xl font-normal md:text-4xl">
              {t('tools_page_title')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-foreground-600 md:text-base">
              {t('tools_page_desc')}
            </p>
          </div>

          <div className="mb-6 flex gap-3 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950">
            <i className="ri-error-warning-line mt-0.5 shrink-0 text-lg" aria-hidden="true"></i>
            <div>
              <div className="text-sm font-semibold">{t('tools_region_warning_title')}</div>
              <p className="mt-0.5 text-xs leading-5 text-amber-900 md:text-sm">
                {t('tools_region_warning_desc')}
              </p>
            </div>
          </div>

          <section aria-label={t('tools_filters_label')} className="mb-6 rounded border border-background-300 bg-background-50 p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem] md:items-end">
              <div>
                <label htmlFor="tool-search" className="mb-1.5 block text-xs font-semibold text-foreground-700">
                  {t('tools_search_label')}
                </label>
                <div className="flex h-11 items-center rounded border border-background-300 bg-background-50 focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-primary-600">
                  <i className="ri-search-line px-3 text-foreground-500" aria-hidden="true"></i>
                  <input
                    id="tool-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t('tools_search_placeholder')}
                    className="h-full min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tool-server" className="mb-1.5 block text-xs font-semibold text-foreground-700">
                  {t('tools_server_label')}
                </label>
                <div className="relative">
                  <select
                    id="tool-server"
                    value={serverFilter}
                    onChange={(event) => setServerFilter(event.target.value as CommunityToolServerFilter)}
                    className="h-11 w-full appearance-none rounded border border-background-300 bg-background-50 px-3 pr-9 text-sm font-medium outline-none focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
                  >
                    <option value="all">{t('tools_all_versions')}</option>
                    {communityToolRegions.map((region) => (
                      <option key={region.code} value={region.code}>{region.label} — {region.name}</option>
                    ))}
                  </select>
                  <i className="ri-arrow-down-s-line pointer-events-none absolute right-3 top-3 text-foreground-500" aria-hidden="true"></i>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t('tools_category_label')}>
              {categories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setActiveCategory(category.key)}
                  aria-pressed={activeCategory === category.key}
                  className={`flex shrink-0 items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
                    activeCategory === category.key
                      ? 'bg-primary-600 text-white'
                      : 'border border-background-300 bg-background-50 text-foreground-700 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <i className={`${category.icon} text-sm`} aria-hidden="true"></i>
                  <span>{t(`tools_cat_${category.key}`)}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-foreground-600" aria-live="polite">
              {t('tools_result_count', { count: filteredTools.length })}
              {selectedServer ? ` · ${selectedServer.label}` : ''}
            </p>
            {selectedServer && (
              <p className="flex items-center gap-1 text-xs text-primary-700">
                <i className="ri-star-line" aria-hidden="true"></i>
                {t('tools_recommended_first')}
              </p>
            )}
          </div>

          {filteredTools.length === 0 ? (
            <div className="border border-background-300 bg-background-50 px-4 py-16 text-center text-sm text-foreground-600">
              <i className="ri-tools-line mb-3 block text-4xl text-background-300" aria-hidden="true"></i>
              <p>{t('tools_no_results')}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map((tool) => {
                const isRecommended = serverFilter !== 'all' && tool.recommendedFor.includes(serverFilter);
                const description = useChineseCopy ? tool.descriptionZh : tool.description;
                const bestFor = useChineseCopy ? tool.bestForZh : tool.bestFor;
                return (
                  <a
                    key={tool.id}
                    href={tool.href}
                    onClick={() => telemetry.trackToolUse(tool.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex min-h-72 flex-col rounded border border-background-300 bg-background-50 p-4 transition-all hover:-translate-y-0.5 hover:border-primary-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary-50 text-xl text-primary-700">
                          <i className={tool.icon} aria-hidden="true"></i>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-foreground-950 group-hover:text-primary-700">
                            {tool.name}
                          </div>
                          <div className="mt-0.5 text-xs text-foreground-500">{t(`tools_cat_${tool.category}`)}</div>
                        </div>
                      </div>
                      <i className="ri-external-link-line mt-1 shrink-0 text-background-400 group-hover:text-primary-600" aria-hidden="true"></i>
                    </div>

                    <div className="mb-3 flex min-h-6 flex-wrap gap-1.5">
                      {isRecommended && (
                        <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-800">
                          <i className="ri-star-fill mr-1" aria-hidden="true"></i>{t('tools_recommended')}
                        </span>
                      )}
                      {tool.isOfficial && (
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
                          {t('tools_official_badge')}
                        </span>
                      )}
                      {tool.compatibility === 'multi-region' && (
                        <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800">
                          {t('tools_multi_region_badge')}
                        </span>
                      )}
                      {tool.compatibility === 'reference' && (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                          {t('tools_reference_badge')}
                        </span>
                      )}
                    </div>

                    <p className="text-sm leading-5 text-foreground-600">{description}</p>

                    <div className="my-3 rounded bg-background-100 px-3 py-2 text-xs leading-5 text-foreground-700">
                      <span className="font-semibold">{t('tools_best_for')} </span>{bestFor}
                    </div>

                    <div className="mt-auto">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {tool.regions.includes('all') ? (
                          <span className="rounded bg-background-100 px-1.5 py-0.5 text-xs text-foreground-600">
                            {t('tools_all_versions')}
                          </span>
                        ) : tool.regions.map((region) => (
                          <span key={region} className="rounded bg-background-100 px-1.5 py-0.5 text-xs font-medium uppercase text-foreground-600">
                            {communityToolRegions.find((item) => item.code === region)?.label ?? region}
                          </span>
                        ))}
                        {tool.platforms.map((platform) => (
                          <span key={platform} className="rounded border border-background-200 px-1.5 py-0.5 text-xs text-foreground-500">
                            {platform}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-background-100 pt-2 text-xs text-foreground-500">
                        <span>{tool.source}</span>
                        <span>{t('tools_verified_date', { date: tool.lastVerified.slice(0, 10) })}</span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          <div className="mt-8 border-t border-background-100 pt-4 text-center text-xs leading-5 text-foreground-500">
            {t('tools_maintenance_note')}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
