import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { mapLocations, monsterImages } from '@/mocks/mapler-house';

const levelRanges = [
  { label: 'all', min: 0, max: 999 },
  { label: '180–220', min: 180, max: 220 },
  { label: '220–260', min: 220, max: 260 },
  { label: '260–280', min: 260, max: 280 },
  { label: '280–300', min: 280, max: 300 },
];

const versions = ['all', 'gms', 'kms', 'cms', 'tms', 'jms', 'msea'];

export default function MapExplorer() {
  const { t } = useTranslation();
  const { versionInfo } = useVersion();

  const [search, setSearch] = useState('');
  const [versionFilter, setVersionFilter] = useState(versionInfo.region || 'all');
  const [selectedRange, setSelectedRange] = useState('all');

  const filtered = useMemo(() => {
    let list = mapLocations;

    if (versionFilter !== 'all') {
      list = list.filter((m) => m.version === 'all' || m.version === versionFilter);
    }

    if (selectedRange !== 'all') {
      const range = levelRanges.find((r) => r.label === selectedRange);
      if (range) {
        list = list.filter((m) => m.minLevel >= range.min && m.maxLevel <= range.max);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.monsters.some((mon) => mon.toLowerCase().includes(q))
      );
    }

    return list;
  }, [search, versionFilter, selectedRange]);

  const mapLabel = filtered.length === 1 ? t('mh_map_count_one', { count: filtered.length }) : t('mh_map_count_other', { count: filtered.length });

  return (
    <div>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
          <input
            type="text"
            placeholder={t('mh_search_map')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-background-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 cursor-pointer"
            >
              <i className="ri-close-line"></i>
            </button>
          )}
        </div>

        {/* Version filter */}
        <div className="flex items-center gap-1.5 bg-background-100 rounded-xl p-1 overflow-x-auto scrollbar-hide">
          {versions.map((v) => (
            <button
              key={v}
              onClick={() => setVersionFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                versionFilter === v
                  ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                  : 'text-foreground-600 hover:text-foreground-900 hover:bg-background-200'
              }`}
            >
              {v === 'all' ? t('mh_filter_all') : v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Level range pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6">
        {levelRanges.map((r) => (
          <button
            key={r.label}
            onClick={() => setSelectedRange(r.label)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              selectedRange === r.label
                ? 'bg-secondary-500 text-background-50 dark:text-foreground-950'
                : 'bg-background-100 text-foreground-600 hover:text-foreground-900 hover:bg-background-200'
            }`}
          >
            {r.label === 'all' ? t('mh_map_any_level') : r.label}
          </button>
        ))}
        <span className="text-xs text-foreground-400 ml-2">
          {mapLabel}
        </span>
      </div>

      {/* Map Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <i className="ri-map-pin-line text-4xl text-foreground-300 block mb-3"></i>
          <p className="text-foreground-500 text-sm">{t('mh_map_filter_empty')}</p>
          <p className="text-foreground-400 text-xs mt-1">{t('mh_map_filter_empty_tip')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((map) => (
            <div
              key={map.name}
              className="group bg-background-50 border border-background-200 rounded-xl overflow-hidden hover:border-primary-300 transition-all duration-200 cursor-pointer"
            >
              <div className="relative w-full h-40 overflow-hidden">
                <img
                  src={map.image}
                  alt={map.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                <div className="absolute top-2 right-2 flex items-center gap-1 bg-secondary-500/90 backdrop-blur-sm text-background-50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <i className="ri-fire-fill text-[10px]"></i>
                  {map.burning}% {t('mh_map_burning')}
                </div>

                <div className="absolute top-2 left-2">
                  <span className="bg-background-50/80 backdrop-blur-sm text-foreground-800 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
                    {map.version === 'all' ? 'ALL' : map.version}
                  </span>
                </div>

                <div className="absolute bottom-2 left-2">
                  <span className="bg-background-50/80 backdrop-blur-sm text-foreground-800 text-xs font-bold px-2.5 py-1 rounded-lg">
                    Lv. {map.minLevel}–{map.maxLevel}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground-900 mb-2 leading-snug truncate" title={map.name}>
                  {map.name}
                </h3>

                <div className="flex flex-wrap items-center gap-1.5">
                  {map.monsters.map((mon) => {
                    const img = monsterImages[mon];
                    return (
                      <span
                        key={mon}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background-100 text-[11px] text-foreground-600 font-medium"
                      >
                        <div className="w-5 h-5 rounded overflow-hidden shrink-0 bg-background-200">
                          <img src={img} alt={mon} className="w-full h-full object-cover object-top" loading="lazy" />
                        </div>
                        {mon}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* External reference hint */}
      <div className="mt-8 p-4 rounded-xl bg-background-100 border border-background-200 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <i className="ri-information-line text-secondary-600 text-sm"></i>
        </div>
        <div>
          <p className="text-xs text-foreground-600 leading-relaxed">{t('mh_map_hint')}</p>
          <a
            href="https://maplemaps.net"
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
          >
            {t('mh_open_link')} maplemaps.net
            <i className="ri-external-link-line text-[10px]"></i>
          </a>
        </div>
      </div>
    </div>
  );
}