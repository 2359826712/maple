import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { mapLocations } from '@/mocks/mapler-house';

const VERSIONS = ['all', 'gms', 'kms', 'cms', 'tms', 'jms', 'msea'] as const;

const versionColor: Record<string, string> = {
  all: 'bg-secondary-100 text-secondary-900',
  gms: 'bg-primary-100 text-primary-700',
  kms: 'bg-accent-100 text-accent-900',
  cms: 'bg-orange-100 text-orange-800',
  tms: 'bg-teal-100 text-teal-800',
  jms: 'bg-red-100 text-red-800',
  msea: 'bg-green-100 text-green-800',
};

const levelRanges = [
  { label: 'maps_level_all', min: 0, max: 999 },
  { label: '180–220', min: 180, max: 220 },
  { label: '220–260', min: 220, max: 260 },
  { label: '260–280', min: 260, max: 280 },
  { label: '280–300', min: 280, max: 300 },
];

export default function MapsPage() {
  const { t } = useTranslation();
  const { versionInfo } = useVersion();
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'level' | 'name'>('level');

  const versionLabel: Record<string, string> = {
    all: t('maps_version_all'),
    gms: 'GMS',
    kms: 'KMS',
    cms: 'CMS',
    tms: 'TMS',
    jms: 'JMS',
    msea: 'MSEA',
  };

  const filteredMaps = useMemo(() => {
    let list = [...mapLocations];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.monsters.some((mon) => mon.toLowerCase().includes(q))
      );
    }

    if (selectedVersion !== 'all') {
      list = list.filter((m) => m.version === 'all' || m.version === selectedVersion);
    }

    const range = levelRanges[selectedLevel];
    if (range.min > 0 || range.max < 999) {
      list = list.filter(
        (m) => m.maxLevel >= range.min && m.minLevel <= range.max
      );
    }

    if (sortBy === 'level') {
      list.sort((a, b) => a.minLevel - b.minLevel);
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [query, selectedVersion, selectedLevel, sortBy]);

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={3} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main className="pt-16 md:pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://readdy.ai/api/search-image?query=Epic%20fantasy%20maplestory%20world%20map%20overview%20with%20floating%20islands%20connected%20by%20rainbow%20bridges%20glowing%20portals%20and%20diverse%20biomes%20from%20lush%20forests%20to%20frozen%20peaks%20and%20desert%20ruins%2C%20maplestory%20game%20art%20style%2C%20warm%20golden%20sunlight%20with%20magical%20particles%2C%20high%20detail%2C%20clean%20simple%20background%20highlighting%20the%20theme&width=1600&height=500&seq=map-hero-bg&orientation=landscape"
              alt="MapleStory World Map"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background-50/70 via-background-50/40 to-background-50"></div>
          </div>
          <div className="relative px-4 md:px-8 py-14 md:py-20">
            <div className="max-w-6xl mx-auto text-center">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary-700 flex items-center justify-center gap-1.5">
                <i className="ri-map-2-line text-primary-500 text-[10px]"></i>
                {t('maps_title_eyebrow')}
              </div>
              <h1 className="mt-2 font-heading text-3xl md:text-5xl font-semibold text-foreground-950">
                {t('maps_title')}
              </h1>
              <p className="mt-3 text-sm md:text-base text-foreground-600 max-w-xl mx-auto">
                {t('maps_desc')}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-2 bg-background-50 rounded-full p-1.5 max-w-lg mx-auto border border-background-200 shadow-sm">
                <div className="flex items-center gap-2 flex-1 pl-3">
                  <i className="ri-search-line text-foreground-500"></i>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('maps_search_placeholder')}
                    className="w-full h-10 bg-transparent text-sm text-foreground-900 placeholder:text-foreground-500 outline-none"
                  />
                </div>
                <button className="h-10 px-5 rounded-full bg-primary-500 text-background-50 dark:text-foreground-950 text-sm font-semibold cursor-pointer whitespace-nowrap hover:bg-primary-600 transition-colors">
                  {t('maps_search_btn')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Filters & Grid */}
        <section className="px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar Filters */}
              <div className="lg:col-span-1 space-y-5">
                {/* Version Filter */}
                <div className="rounded-xl border border-background-200 bg-background-50 p-4">
                  <div className="text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <i className="ri-global-line text-primary-500 text-[10px]"></i>
                    {t('maps_version_label')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {VERSIONS.map((v) => (
                      <button
                        key={v}
                        onClick={() => setSelectedVersion(v)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                          selectedVersion === v
                            ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                            : 'bg-background-100 text-foreground-700 hover:bg-primary-50'
                        }`}
                      >
                        {versionLabel[v]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level Range Filter */}
                <div className="rounded-xl border border-background-200 bg-background-50 p-4">
                  <div className="text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <i className="ri-bar-chart-line text-primary-500 text-[10px]"></i>
                    {t('maps_level_label')}
                  </div>
                  <div className="space-y-1">
                    {levelRanges.map((range, i) => (
                      <button
                        key={range.label}
                        onClick={() => setSelectedLevel(i)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                          selectedLevel === i
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-foreground-700 hover:bg-background-100'
                        }`}
                      >
                        {range.label === 'maps_level_all' ? t('maps_level_all') : range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="rounded-xl border border-background-200 bg-background-50 p-4">
                  <div className="text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <i className="ri-arrow-up-down-line text-primary-500 text-[10px]"></i>
                    {t('maps_sort_label')}
                  </div>
                  <div className="flex gap-1.5">
                    {[
                      { key: 'level' as const, label: t('maps_sort_level') },
                      { key: 'name' as const, label: t('maps_sort_name') },
                    ].map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setSortBy(s.key)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                          sortBy === s.key
                            ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                            : 'bg-background-100 text-foreground-700 hover:bg-primary-50'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="rounded-xl border border-background-200 bg-background-50 p-4">
                  <div className="text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <i className="ri-dashboard-line text-primary-500 text-[10px]"></i>
                    {t('maps_stats_label')}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-600">{t('maps_stats_total')}</span>
                      <span className="font-semibold text-foreground-950">{mapLocations.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-600">{t('maps_stats_showing')}</span>
                      <span className="font-semibold text-foreground-950">{filteredMaps.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-600">{t('maps_stats_burn')}</span>
                      <span className="font-semibold text-foreground-950">
                        {mapLocations.filter((m) => m.burning >= 10).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Cards Grid */}
              <div className="lg:col-span-3">
                {filteredMaps.length === 0 ? (
                  <div className="rounded-xl border border-background-200 bg-background-50 p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-background-100 flex items-center justify-center mx-auto mb-4">
                      <i className="ri-map-pin-2-line text-foreground-500 text-2xl"></i>
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground-900">{t('maps_no_results')}</h3>
                    <p className="text-sm text-foreground-600 mt-1">{t('maps_no_results_tip')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredMaps.map((map) => (
                      <div
                        key={map.name}
                        className="group rounded-xl border border-background-200 bg-background-50 overflow-hidden hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="relative w-full h-44 overflow-hidden">
                          <img
                            src={map.image}
                            alt={map.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                          <div className="absolute top-3 left-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${versionColor[map.version]}`}>
                              {map.version === 'all' ? (
                                <i className="ri-earth-line text-[9px]"></i>
                              ) : (
                                <i className="ri-flag-line text-[9px]"></i>
                              )}
                              {versionLabel[map.version]}
                            </span>
                          </div>
                          {map.burning >= 10 && (
                            <div className="absolute top-3 right-3">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-800">
                                <i className="ri-fire-line text-[9px]"></i>
                                {map.burning}×
                              </span>
                            </div>
                          )}
                          <div className="absolute bottom-3 left-3 right-3">
                            <div className="text-xs font-semibold text-background-50/90 flex items-center gap-1">
                              <i className="ri-map-pin-line text-[10px]"></i>
                              Lv.{map.minLevel} – {map.maxLevel}
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          <h3 className="font-heading text-sm font-semibold text-foreground-950 leading-snug line-clamp-2">
                            {map.name}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {map.monsters.map((mon) => (
                              <span
                                key={mon}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background-100 text-foreground-700 text-[11px] font-medium"
                              >
                                <i className="ri-bug-line text-[9px] text-foreground-500"></i>
                                {mon}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center gap-3 text-[11px] text-foreground-500">
                            <span className="flex items-center gap-1">
                              <i className="ri-bar-chart-line text-[9px]"></i>
                              Lv.{map.minLevel}–{map.maxLevel}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-fire-line text-[9px]"></i>
                              Burn {map.burning}×
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}