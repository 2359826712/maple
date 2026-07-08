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

const externalTools = [
  { name: 'mstoolbox.netlify.app', desc: 'mh_external_mstoolbox', icon: 'ri-tools-line', href: 'https://mstoolbox.netlify.app' },
  { name: 'maplestorycube.org', desc: 'mh_external_cube', icon: 'ri-dice-line', href: 'https://maplestorycube.org' },
  { name: 'lintx.github.io', desc: 'mh_external_flame', icon: 'ri-fire-line', href: 'https://lintx.github.io' },
  { name: 'xenogents.github.io', desc: 'mh_external_legion', icon: 'ri-layout-grid-line', href: 'https://xenogents.github.io' },
  { name: 'maplemaps.net', desc: 'mh_external_maplemaps', icon: 'ri-map-pin-line', href: 'https://maplemaps.net' },
  { name: 'maples.im', desc: 'mh_external_fashion', icon: 'ri-t-shirt-line', href: 'https://maples.im' },
];

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

  useEffect(() => writeStoredArray(FAVORITES_KEY, favorites), [favorites]);
  useEffect(() => writeStoredArray(RECENT_KEY, recent), [recent]);

  const recommendedMaps = useMemo(
    () =>
      mapLocations
        .filter((map) => map.version === 'all' || map.version === versionInfo.id || map.version === versionInfo.region)
        .slice(0, 4),
    [versionInfo.id, versionInfo.region],
  );

  const activeMeta = sections.find((section) => section.key === activeSection) || sections[0];
  const toolMenuOptions = useMemo(
    () =>
      sections
        .filter((section) => section.key !== 'dashboard')
        .map((section) => ({
          value: section.key,
          label: t(section.title),
          icon: section.icon,
          favorite: favorites.includes(section.key),
        })),
    [favorites, t],
  );
  const favoriteToolMenuOptions = useMemo(
    () =>
      sections
        .filter((section) => favorites.includes(section.key) && section.key !== 'dashboard')
        .map((section) => ({
          value: section.key,
          label: t(section.title),
          icon: section.icon,
          favorite: true,
        })),
    [favorites, t],
  );

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
      <Navbar
        onOpenNotifications={() => setShowNotifications(true)}
        unread={3}
        toolMenu={{
          label: t('mh_tool_jump'),
          allLabel: t('mh_tool_menu_all'),
          favoritesLabel: t('mh_tool_menu_favorites'),
          emptyFavoritesLabel: t('mh_no_favorites'),
          value: activeSection,
          options: toolMenuOptions,
          favoriteOptions: favoriteToolMenuOptions,
          onSelect: (value) => openSection(value as SectionKey),
          onToggleFavorite: (value) => toggleFavorite(value as SectionKey),
        }}
      />
      <NotificationDrawer open={showNotifications} onClose={() => setShowNotifications(false)} />

      <main className="pt-20 md:pt-24">
        <section className="border-b border-primary-200/30 bg-background-50">
          <div className="w-full px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-7xl mx-auto">
              <div className="max-w-4xl">
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
              </div>
            </div>
          </div>
        </section>

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
      <div className="rounded-lg border border-background-200 bg-background-100 p-4">
        <h3 className="text-sm font-semibold text-foreground-950">{t('mh_recent_tools')}</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
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
