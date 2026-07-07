import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import Navbar from '@/pages/home/components/Navbar';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import Footer from '@/pages/home/components/Footer';
import OfficialAnnouncements from './components/OfficialAnnouncements';
import CharacterSearch from './components/CharacterSearch';
import ClassStatisticsPanel from './components/ClassStatisticsPanel';
import GrowthSimulator from './components/GrowthSimulator';
import EquipmentEnhanceSim from './components/EquipmentEnhanceSim';
import LegionMapQuery from './components/LegionMapQuery';
import FashionSimulator from './components/FashionSimulator';
import Simulators from '@/pages/home/components/Simulators';
import MapExplorer from './components/MapExplorer';
import { mapLocations } from '@/mocks/mapler-house';

type SectionKey =
  | 'dashboard'
  | 'simulators'
  | 'announcements'
  | 'char-lookup'
  | 'stats'
  | 'growth'
  | 'enhance'
  | 'legion'
  | 'maps'
  | 'fashion';

type ToolCategory = 'all' | 'simulation' | 'database' | 'planning' | 'community';
type ToolReference = { name: string; href: string };

const FAVORITES_KEY = 'maplehub-tool-favorites';
const RECENT_KEY = 'maplehub-tool-recent';

const sections: Array<{
  key: SectionKey;
  label: string;
  title: string;
  desc: string;
  category: Exclude<ToolCategory, 'all'>;
  icon: string;
  accent: 'primary' | 'accent' | 'secondary';
  references?: ToolReference[];
}> = [
  { key: 'dashboard', label: 'mh_nav_dashboard', title: 'mh_dashboard_title', desc: 'mh_dashboard_desc', category: 'database', icon: 'ri-dashboard-3-line', accent: 'primary' },
  { key: 'simulators', label: 'mh_nav_simulators', title: 'mh_section_simulators', desc: 'mh_section_simulators_desc', category: 'simulation', icon: 'ri-calculator-line', accent: 'primary' },
  {
    key: 'enhance',
    label: 'mh_nav_enhance',
    title: 'mh_section_enhance',
    desc: 'mh_section_enhance_desc',
    category: 'simulation',
    icon: 'ri-hammer-line',
    accent: 'secondary',
    references: [
      { name: 'maplestorycube.org', href: 'https://maplestorycube.org' },
      { name: 'lintx.github.io', href: 'https://lintx.github.io' },
    ],
  },
  {
    key: 'maps',
    label: 'mh_nav_maps',
    title: 'mh_section_maps',
    desc: 'mh_section_maps_desc',
    category: 'database',
    icon: 'ri-map-pin-line',
    accent: 'accent',
    references: [{ name: 'maplemaps.net', href: 'https://maplemaps.net' }],
  },
  { key: 'char-lookup', label: 'mh_nav_char_lookup', title: 'mh_section_char_lookup', desc: 'mh_section_char_lookup_desc', category: 'database', icon: 'ri-user-search-line', accent: 'primary' },
  {
    key: 'growth',
    label: 'mh_nav_growth',
    title: 'mh_section_growth',
    desc: 'mh_section_growth_desc',
    category: 'planning',
    icon: 'ri-line-chart-line',
    accent: 'accent',
    references: [{ name: 'mstoolbox.netlify.app', href: 'https://mstoolbox.netlify.app' }],
  },
  {
    key: 'legion',
    label: 'mh_nav_legion',
    title: 'mh_section_legion',
    desc: 'mh_section_legion_desc',
    category: 'planning',
    icon: 'ri-layout-grid-line',
    accent: 'secondary',
    references: [{ name: 'xenogents.github.io', href: 'https://xenogents.github.io' }],
  },
  { key: 'stats', label: 'mh_nav_stats', title: 'mh_section_stats', desc: 'mh_section_stats_desc', category: 'database', icon: 'ri-bar-chart-grouped-line', accent: 'primary' },
  { key: 'announcements', label: 'mh_nav_announcements', title: 'mh_section_announcements', desc: 'mh_section_announcements_desc', category: 'community', icon: 'ri-megaphone-line', accent: 'accent' },
  {
    key: 'fashion',
    label: 'mh_nav_fashion',
    title: 'mh_section_fashion',
    desc: 'mh_section_fashion_desc',
    category: 'planning',
    icon: 'ri-t-shirt-line',
    accent: 'secondary',
    references: [{ name: 'maples.im', href: 'https://maples.im' }],
  },
];

const categoryOptions: Array<{ key: ToolCategory; label: string; icon: string }> = [
  { key: 'all', label: 'mh_toolbox_all', icon: 'ri-apps-2-line' },
  { key: 'simulation', label: 'mh_toolbox_simulation', icon: 'ri-calculator-line' },
  { key: 'database', label: 'mh_toolbox_database', icon: 'ri-database-2-line' },
  { key: 'planning', label: 'mh_toolbox_planning', icon: 'ri-route-line' },
  { key: 'community', label: 'mh_toolbox_community', icon: 'ri-megaphone-line' },
];

const externalTools = [
  { name: 'mstoolbox.netlify.app', desc: 'mh_external_mstoolbox', icon: 'ri-tools-line', href: 'https://mstoolbox.netlify.app' },
  { name: 'maplestorycube.org', desc: 'mh_external_cube', icon: 'ri-dice-line', href: 'https://maplestorycube.org' },
  { name: 'lintx.github.io', desc: 'mh_external_flame', icon: 'ri-fire-line', href: 'https://lintx.github.io' },
  { name: 'xenogents.github.io', desc: 'mh_external_legion', icon: 'ri-layout-grid-line', href: 'https://xenogents.github.io' },
  { name: 'maplemaps.net', desc: 'mh_external_maplemaps', icon: 'ri-map-pin-line', href: 'https://maplemaps.net' },
  { name: 'maples.im', desc: 'mh_external_fashion', icon: 'ri-t-shirt-line', href: 'https://maples.im' },
];

const toolGroups: Array<{
  title: string;
  desc: string;
  icon: string;
  tools: SectionKey[];
  references: ToolReference[];
}> = [
  {
    title: 'mh_group_growth_title',
    desc: 'mh_group_growth_desc',
    icon: 'ri-seedling-line',
    tools: ['growth'],
    references: [{ name: 'mstoolbox.netlify.app', href: 'https://mstoolbox.netlify.app' }],
  },
  {
    title: 'mh_group_enhance_title',
    desc: 'mh_group_enhance_desc',
    icon: 'ri-hammer-line',
    tools: ['enhance'],
    references: [
      { name: 'maplestorycube.org', href: 'https://maplestorycube.org' },
      { name: 'lintx.github.io', href: 'https://lintx.github.io' },
    ],
  },
  {
    title: 'mh_group_legion_maps_title',
    desc: 'mh_group_legion_maps_desc',
    icon: 'ri-map-2-line',
    tools: ['legion', 'maps'],
    references: [
      { name: 'xenogents.github.io', href: 'https://xenogents.github.io' },
      { name: 'maplemaps.net', href: 'https://maplemaps.net' },
    ],
  },
  {
    title: 'mh_group_fashion_title',
    desc: 'mh_group_fashion_desc',
    icon: 'ri-t-shirt-line',
    tools: ['fashion'],
    references: [{ name: 'maples.im', href: 'https://maples.im' }],
  },
];

const tintMap = {
  primary: { bg: 'bg-primary-100', text: 'text-primary-700', border: 'hover:border-primary-300', soft: 'bg-primary-50' },
  accent: { bg: 'bg-accent-100', text: 'text-accent-700', border: 'hover:border-accent-300', soft: 'bg-accent-50' },
  secondary: { bg: 'bg-secondary-100', text: 'text-secondary-800', border: 'hover:border-secondary-300', soft: 'bg-secondary-50' },
};

const readStoredArray = (key: string) => {
  if (typeof window === 'undefined') return [] as SectionKey[];
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as SectionKey[]) : [];
  } catch {
    return [];
  }
};

const writeStoredArray = (key: string, value: SectionKey[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

function getInitialSection(): SectionKey {
  const hash = window.location.hash.replace('#', '') as SectionKey;
  return sections.some((section) => section.key === hash) ? hash : 'dashboard';
}

export default function MaplerHousePage() {
  const { t } = useTranslation();
  const { versionInfo } = useVersion();
  const [activeSection, setActiveSection] = useState<SectionKey>(getInitialSection);
  const [showNotifications, setShowNotifications] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toolQuery, setToolQuery] = useState('');
  const [category, setCategory] = useState<ToolCategory>('all');
  const [favorites, setFavorites] = useState<SectionKey[]>(() => readStoredArray(FAVORITES_KEY));
  const [recent, setRecent] = useState<SectionKey[]>(() => readStoredArray(RECENT_KEY));

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '') as SectionKey;
      if (sections.some((section) => section.key === hash)) setActiveSection(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => writeStoredArray(FAVORITES_KEY, favorites), [favorites]);
  useEffect(() => writeStoredArray(RECENT_KEY, recent), [recent]);

  const filteredTools = useMemo(() => {
    const q = toolQuery.trim().toLowerCase();
    return sections
      .filter((section) => section.key !== 'dashboard')
      .filter((section) => category === 'all' || section.category === category)
      .filter((section) => {
        if (!q) return true;
        return [t(section.label), t(section.title), t(section.desc), section.key].some((value) => value.toLowerCase().includes(q));
      });
  }, [category, t, toolQuery]);

  const recommendedMaps = useMemo(
    () =>
      mapLocations
        .filter((map) => map.version === 'all' || map.version === versionInfo.id || map.version === versionInfo.region)
        .slice(0, 4),
    [versionInfo.id, versionInfo.region],
  );

  const activeMeta = sections.find((section) => section.key === activeSection) || sections[0];

  const openSection = (key: SectionKey) => {
    setActiveSection(key);
    window.location.hash = key;
    setRecent((current) => [key, ...current.filter((item) => item !== key)].slice(0, 5));
  };

  const toggleFavorite = (key: SectionKey) => {
    setFavorites((current) => (current.includes(key) ? current.filter((item) => item !== key) : [key, ...current]));
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardPanel
            favorites={favorites}
            recent={recent}
            recommendedMaps={recommendedMaps}
            onOpen={openSection}
            t={t}
          />
        );
      case 'simulators': return <Simulators />;
      case 'announcements': return <OfficialAnnouncements />;
      case 'char-lookup': return <CharacterSearch />;
      case 'stats': return <ClassStatisticsPanel />;
      case 'growth': return <GrowthSimulator />;
      case 'enhance': return <EquipmentEnhanceSim />;
      case 'legion': return <LegionMapQuery />;
      case 'maps': return <MapExplorer />;
      case 'fashion': return <FashionSimulator />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar onOpenNotifications={() => setShowNotifications(true)} unread={3} />
      <NotificationDrawer open={showNotifications} onClose={() => setShowNotifications(false)} />

      <main className="pt-20 md:pt-24">
        <section className="border-b border-primary-200/30 bg-background-50">
          <div className="w-full px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                    <i className="ri-tools-line"></i>
                    {t('mh_toolbox_badge')}
                  </div>
                  <h1 className="mt-4 font-heading text-3xl md:text-5xl font-semibold text-foreground-950">
                    {t('mh_title')}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm md:text-base leading-relaxed text-foreground-700">
                    {t('mh_subtitle')}
                  </p>

                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
                    <Metric label={t('mh_metric_tools')} value={String(sections.length - 1)} icon="ri-apps-line" />
                    <Metric label={t('mh_metric_maps')} value={String(mapLocations.length)} icon="ri-map-2-line" />
                    <Metric label={t('mh_metric_version')} value={versionInfo.shortLabel} icon="ri-global-line" />
                    <Metric label={t('mh_metric_sources')} value={String(externalTools.length)} icon="ri-links-line" />
                  </div>
                </div>

                <div className="rounded-lg border border-background-200 bg-background-100 p-4">
                  <div className="text-xs font-semibold text-foreground-500 uppercase">{t('mh_quick_find')}</div>
                  <div className="relative mt-3">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400"></i>
                    <input
                      value={toolQuery}
                      onChange={(event) => setToolQuery(event.target.value)}
                      placeholder={t('mh_search_tools')}
                      className="w-full h-11 rounded-md border border-background-300 bg-background-50 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categoryOptions.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setCategory(option.key)}
                        className={`h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                          category === option.key ? 'bg-primary-600 text-background-50' : 'bg-background-50 text-foreground-700 border border-background-200 hover:bg-primary-50'
                        }`}
                      >
                        <i className={option.icon}></i>
                        {t(option.label)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <ToolGroups onOpen={openSection} t={t} />
              <ToolGrid tools={filteredTools} favorites={favorites} onOpen={openSection} onFavorite={toggleFavorite} t={t} />
            </div>
          </div>
        </section>

        <div className={`sticky z-30 transition-all duration-300 ${scrolled ? 'top-16 md:top-20' : 'top-0'}`}>
          <div className="bg-background-50 border-b border-primary-200/30">
            <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
              {sections.map((section) => (
                <a
                  key={section.key}
                  href={`#${section.key}`}
                  onClick={() => openSection(section.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeSection === section.key
                      ? 'bg-primary-600 text-background-50 shadow-sm'
                      : 'text-foreground-600 hover:text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <i className={section.icon}></i>
                  {t(section.label)}
                </a>
              ))}
            </div>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-5 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground-950">{t(activeMeta.title)}</h2>
              <p className="text-sm text-foreground-600 mt-1 max-w-3xl">{t(activeMeta.desc)}</p>
            </div>
            {activeSection !== 'dashboard' && (
              <a
                href="#dashboard"
                onClick={() => openSection('dashboard')}
                className="h-10 px-4 rounded-full border border-background-200 bg-background-50 hover:bg-primary-50 text-sm font-semibold text-foreground-800 cursor-pointer whitespace-nowrap inline-flex items-center"
              >
                <i className="ri-dashboard-3-line mr-1"></i>
                {t('mh_back_dashboard')}
              </a>
            )}
          </div>
          <div className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-6">
            {renderSection()}
          </div>
        </section>

        <ExternalTools t={t} />
      </main>

      <Footer />
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-lg border border-background-200 bg-background-100 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-foreground-500">{label}</span>
        <i className={`${icon} text-primary-600`}></i>
      </div>
      <div className="mt-2 font-heading text-xl font-semibold text-foreground-950">{value}</div>
    </div>
  );
}

function ToolGroups({ onOpen, t }: { onOpen: (key: SectionKey) => void; t: (key: string) => string }) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground-950">{t('mh_required_groups_title')}</h2>
          <p className="mt-1 text-sm text-foreground-600">{t('mh_required_groups_desc')}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {toolGroups.map((group) => (
          <article key={group.title} className="rounded-lg border border-background-200 bg-background-100 p-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-md bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                <i className={`${group.icon} text-xl`}></i>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading text-base font-semibold text-foreground-950">{t(group.title)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-foreground-600">{t(group.desc)}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {group.tools.map((key) => {
                    const section = sections.find((item) => item.key === key);
                    if (!section) return null;
                    return (
                      <a
                        key={key}
                        href={`#${key}`}
                        onClick={() => onOpen(key)}
                        className="h-8 px-3 rounded-full bg-background-50 border border-background-200 hover:bg-primary-50 text-xs font-semibold text-foreground-800 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className={section.icon}></i>
                        {t(section.title)}
                      </a>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {group.references.map((reference) => (
                    <a
                      key={reference.name}
                      href={reference.href}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="px-2 py-1 rounded-md bg-background-50 text-[11px] font-semibold text-primary-700 hover:text-primary-800 border border-background-200 inline-flex items-center gap-1"
                    >
                      {reference.name}
                      <i className="ri-external-link-line"></i>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ToolGrid({
  tools,
  favorites,
  onOpen,
  onFavorite,
  t,
}: {
  tools: typeof sections;
  favorites: SectionKey[];
  onOpen: (key: SectionKey) => void;
  onFavorite: (key: SectionKey) => void;
  t: (key: string) => string;
}) {
  if (tools.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-background-300 bg-background-100 p-8 text-center text-sm text-foreground-500">
        <i className="ri-search-eye-line text-3xl block mb-2"></i>
        {t('mh_toolbox_empty')}
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {tools.map((tool) => {
        const tint = tintMap[tool.accent];
        const isFavorite = favorites.includes(tool.key);
        return (
          <article
            key={tool.key}
            className={`rounded-lg border border-background-200 bg-background-50 p-4 transition-colors ${tint.border} hover:bg-background-100`}
          >
            <div className="flex items-start justify-between gap-3">
              <a
                href={`#${tool.key}`}
                onClick={() => onOpen(tool.key)}
                className="min-w-0 flex items-start gap-3 text-left cursor-pointer"
              >
                <span className={`w-11 h-11 rounded-md ${tint.bg} ${tint.text} flex items-center justify-center shrink-0`}>
                  <i className={`${tool.icon} text-xl`}></i>
                </span>
                <span className="min-w-0">
                  <span className="block font-heading text-base font-semibold text-foreground-950">{t(tool.title)}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-foreground-600 line-clamp-2">{t(tool.desc)}</span>
                </span>
              </a>
              <button
                type="button"
                onClick={() => onFavorite(tool.key)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                  isFavorite ? 'bg-secondary-100 text-secondary-700' : 'bg-background-100 text-foreground-500 hover:text-secondary-700'
                }`}
                aria-label="favorite"
              >
                <i className={isFavorite ? 'ri-star-fill' : 'ri-star-line'}></i>
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${tint.bg} ${tint.text}`}>
                {t(`mh_toolbox_${tool.category}`)}
              </span>
              <a
                href={`#${tool.key}`}
                onClick={() => onOpen(tool.key)}
                className="text-xs font-semibold text-primary-700 hover:text-primary-800 cursor-pointer"
              >
                {t('mh_open_tool')}
                <i className="ri-arrow-right-line ml-1"></i>
              </a>
            </div>
            {tool.references && tool.references.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tool.references.map((reference) => (
                  <a
                    key={reference.name}
                    href={reference.href}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="px-2 py-1 rounded-md bg-background-100 text-[11px] font-semibold text-foreground-600 hover:text-primary-700 inline-flex items-center gap-1"
                  >
                    {reference.name}
                    <i className="ri-external-link-line"></i>
                  </a>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function DashboardPanel({
  favorites,
  recent,
  recommendedMaps,
  onOpen,
  t,
}: {
  favorites: SectionKey[];
  recent: SectionKey[];
  recommendedMaps: typeof mapLocations;
  onOpen: (key: SectionKey) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const favoriteTools = sections.filter((section) => favorites.includes(section.key) && section.key !== 'dashboard');
  const recentTools = recent
    .map((key) => sections.find((section) => section.key === key))
    .filter((section): section is (typeof sections)[number] => Boolean(section) && section.key !== 'dashboard');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground-950">{t('mh_integrated_title')}</h3>
          <p className="mt-1 text-sm text-foreground-600">{t('mh_integrated_desc')}</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <WorkflowStep icon="ri-search-line" title={t('mh_flow_find')} desc={t('mh_flow_find_desc')} />
            <WorkflowStep icon="ri-calculator-line" title={t('mh_flow_simulate')} desc={t('mh_flow_simulate_desc')} />
            <WorkflowStep icon="ri-map-pin-line" title={t('mh_flow_route')} desc={t('mh_flow_route_desc')} />
          </div>
        </div>
        <div className="rounded-lg border border-background-200 bg-background-100 p-4">
          <h3 className="text-sm font-semibold text-foreground-950">{t('mh_recent_tools')}</h3>
          <div className="mt-3 space-y-2">
            {(recentTools.length ? recentTools : sections.filter((section) => ['maps', 'enhance', 'growth'].includes(section.key))).slice(0, 3).map((tool) => (
              <a
                key={tool.key}
                href={`#${tool.key}`}
                onClick={() => onOpen(tool.key)}
                className="w-full rounded-md bg-background-50 border border-background-200 px-3 py-2 flex items-center gap-2 text-left hover:bg-primary-50 cursor-pointer"
              >
                <i className={`${tool.icon} text-primary-600`}></i>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground-900 truncate">{t(tool.title)}</span>
                  <span className="block text-xs text-foreground-500 truncate">{t(tool.label)}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-lg font-semibold text-foreground-950">{t('mh_training_spots')}</h3>
            <a href="#maps" onClick={() => onOpen('maps')} className="text-xs font-semibold text-primary-700 hover:text-primary-800 cursor-pointer">
              {t('mh_open_map_database')}
              <i className="ri-arrow-right-line ml-1"></i>
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendedMaps.map((map) => (
              <a
                key={map.name}
                href="#maps"
                onClick={() => onOpen('maps')}
                className="rounded-lg border border-background-200 bg-background-100 p-3 text-left hover:border-primary-300 hover:bg-primary-50/40 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-foreground-950 truncate">{map.name}</div>
                    <div className="mt-1 text-xs text-foreground-600">Lv. {map.minLevel}-{map.maxLevel} · {map.monsters.join(', ')}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary-100 px-2 py-1 text-[11px] font-semibold text-secondary-800">
                    {map.burning}% {t('mh_map_burning')}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-foreground-600">
                  <span className="rounded-md bg-background-50 px-2 py-1">{t('mh_exp_index')} {map.minLevel + map.burning}</span>
                  <span className="rounded-md bg-background-50 px-2 py-1">{t('mh_mob_groups')} {map.monsters.length}</span>
                  <span className="rounded-md bg-background-50 px-2 py-1 uppercase">{map.version}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-background-200 bg-background-100 p-4">
          <h3 className="text-sm font-semibold text-foreground-950">{t('mh_favorite_tools')}</h3>
          <div className="mt-3 space-y-2">
            {favoriteTools.length === 0 ? (
              <div className="rounded-md border border-dashed border-background-300 bg-background-50 p-4 text-sm text-foreground-500">
                {t('mh_no_favorites')}
              </div>
            ) : (
              favoriteTools.slice(0, 5).map((tool) => (
                <a
                  key={tool.key}
                  href={`#${tool.key}`}
                  onClick={() => onOpen(tool.key)}
                  className="w-full rounded-md bg-background-50 border border-background-200 px-3 py-2 flex items-center gap-2 text-left hover:bg-secondary-50 cursor-pointer"
                >
                  <i className={`${tool.icon} text-secondary-700`}></i>
                  <span className="text-sm font-semibold text-foreground-900">{t(tool.title)}</span>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowStep({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-background-200 bg-background-100 p-4">
      <div className="w-9 h-9 rounded-md bg-primary-100 text-primary-700 flex items-center justify-center">
        <i className={icon}></i>
      </div>
      <div className="mt-3 font-semibold text-foreground-950">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-foreground-600">{desc}</p>
    </div>
  );
}

function ExternalTools({ t }: { t: (key: string) => string }) {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
      <div className="rounded-lg border border-background-200 bg-background-100 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground-950">{t('mh_external_tools_title')}</h3>
            <p className="text-sm text-foreground-600 mt-1">{t('mh_external_tools_desc')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {externalTools.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-background-200 bg-background-50 hover:border-primary-300 hover:bg-primary-50/30 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-md bg-secondary-100 flex items-center justify-center flex-shrink-0">
                <i className={`${link.icon} text-secondary-700`}></i>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground-900 truncate">{link.name}</div>
                <div className="text-xs text-foreground-500">{t(link.desc)}</div>
              </div>
              <i className="ri-external-link-line text-foreground-400 flex-shrink-0 ml-auto"></i>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
