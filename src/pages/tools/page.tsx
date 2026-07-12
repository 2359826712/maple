import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { communityTools, type CommunityTool } from '@/mocks/communityTools';
import { isAvailableInVersion } from '@/domain/regionModel';
import { telemetry } from '@/services/telemetry';

const categories = [
  { key: 'all', en: 'All', icon: 'ri-apps-line' },
  { key: 'calculator', en: 'Calculators', icon: 'ri-calculator-line' },
  { key: 'database', en: 'Databases', icon: 'ri-database-2-line' },
  { key: 'simulator', en: 'Simulators', icon: 'ri-gamepad-line' },
  { key: 'tracker', en: 'Trackers', icon: 'ri-line-chart-line' },
  { key: 'utility', en: 'Utilities', icon: 'ri-tools-line' },
  { key: 'guide', en: 'Guides', icon: 'ri-book-open-line' },
  { key: 'community', en: 'Community', icon: 'ri-chat-3-line' },
] as const;

export default function ToolsPage() {
  const { t } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [versionFilter, setVersionFilter] = useState<string>('all');

  const filteredTools = useMemo(() => {
    let tools = communityTools;

    if (activeCategory !== 'all') {
      tools = tools.filter((tool) => tool.category === activeCategory);
    }
    if (versionFilter !== 'all') {
      tools = tools.filter((tool) => isAvailableInVersion(tool.regions, versionFilter.toLowerCase()));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      tools = tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q),
      );
    }

    return tools;
  }, [activeCategory, searchQuery, versionFilter]);

  const groupedTools = useMemo(() => {
    const groups: Record<string, CommunityTool[]> = {};
    filteredTools.forEach((tool) => {
      const cat = tool.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(tool);
    });
    return groups;
  }, [filteredTools]);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-950">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-serif text-2xl font-normal md:text-3xl">
              {t('tools_page_title')}
            </h1>
            <p className="mt-1 text-sm text-foreground-600">
              {t('tools_page_desc')}
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${
                    activeCategory === cat.key
                      ? 'bg-primary-600 text-white'
                      : 'border border-background-300 bg-background-50 text-foreground-950 hover:bg-background-100'
                  }`}
                >
                  <i className={`${cat.icon} text-sm`}></i>
                  <span>{t('tools_cat_' + cat.key)}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {['all', 'GMS', 'KMS', 'TMS'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVersionFilter(v)}
                  className={`rounded px-2 py-1 text-xs ${
                    versionFilter === v
                      ? 'bg-foreground-950 text-white'
                      : 'border border-background-300 bg-background-50 text-foreground-600 hover:bg-background-100'
                  }`}
                >
                  {v === 'all' ? t('tools_all_versions') : v}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="mb-6 flex h-10 items-center border border-background-300 bg-background-50 sm:max-w-md">
            <i className="ri-search-line px-2 text-foreground-600"></i>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('tools_search_placeholder')}
              className="h-full min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
            />
          </div>

          {/* Tools grid */}
          {filteredTools.length === 0 ? (
            <div className="border border-background-300 bg-background-50 px-4 py-16 text-center text-sm text-foreground-600">
              <i className="ri-tools-line mb-3 block text-4xl text-background-300"></i>
              <p>{t('tools_no_results')}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map((tool) => (
                <a
                  key={tool.id}
                  href={tool.href}
                  onClick={() => telemetry.trackToolUse(tool.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="group block rounded border border-background-300 bg-background-50 p-4 transition-all hover:border-primary-600 hover:shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded bg-background-50 text-lg text-primary-600">
                        <i className={tool.icon}></i>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground-950 group-hover:text-primary-600">
                          {tool.name}
                        </div>
                        <div className="text-xs text-foreground-500">{t('tools_cat_' + tool.category)}</div>
                      </div>
                    </div>
                    <i className="ri-external-link-line mt-1 text-background-300 group-hover:text-primary-600"></i>
                  </div>

                  <p className="mb-3 text-sm text-foreground-600">
                    {tool.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {tool.regions.map((v) => (
                      <span
                        key={v}
                        className="rounded bg-background-100 px-1.5 py-0.5 text-xs text-foreground-600"
                      >
                        {v.toUpperCase()}
                      </span>
                    ))}
                    {tool.platforms.map((p) => (
                      <span
                        key={p}
                        className="rounded bg-background-50 px-1.5 py-0.5 text-xs text-foreground-500"
                      >
                        {p}
                      </span>
                    ))}
                    {tool.isFree ? (
                      <span className="text-xs text-green-800">
                        {t('tools_free')}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-800">
                        {t('tools_paid')}
                      </span>
                    )}
                    {!tool.isActive && (
                      <span className="text-xs text-red-700">
                        {t('tools_inactive')}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 border-t border-background-100 pt-2 text-xs text-foreground-500">
                    {tool.source} · {tool.lastVerified.slice(0, 10)}
                  </div>
                </a>
              ))}
            </div>
          )}

          <div className="mt-8 border-t border-background-100 pt-4 text-center text-xs text-foreground-500">
            {t('tools_maintenance_note')}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
