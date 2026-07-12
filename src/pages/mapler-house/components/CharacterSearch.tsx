import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import {
  fetchNexonRankings,
  isRankingVersionSupported,
  type NexonRankingRow,
} from '@/services/nexonRankings';
import { telemetry } from '@/services/telemetry';

type OfficialCharacterResult = NexonRankingRow & {
  worldName?: string;
};

export default function CharacterSearch() {
  const { t } = useTranslation();
  const { version, versionInfo } = useVersion();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<OfficialCharacterResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [searching, setSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('mh_recent_chars') : null;
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const officialLookupSupported = isRankingVersionSupported(version);

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    if (!officialLookupSupported) {
      telemetry.trackCharacterLookup(version, 'unsupported');
      return;
    }
    setSearching(true);
    setNotFound(false);
    setError(false);

    try {
      const data = await fetchNexonRankings({
        version,
        board: 'overall',
        world: 'all',
        characterName: trimmedQuery,
      });
      const found = data.ranks.find(
        (rank) => rank.characterName.toLowerCase() === trimmedQuery.toLowerCase(),
      ) ?? data.ranks[0] ?? null;

      if (found) {
        telemetry.trackCharacterLookup(version, 'success');
        setResult(found);
        setNotFound(false);
        setRecentSearches((prev) => {
          const updated = [found.characterName, ...prev.filter((s) => s !== found.characterName)].slice(0, 5);
          localStorage.setItem('mh_recent_chars', JSON.stringify(updated));
          return updated;
        });
      } else {
        telemetry.trackCharacterLookup(version, 'not-found');
        setResult(null);
        setNotFound(true);
      }
    } catch {
      telemetry.trackCharacterLookup(version, 'failure');
      setResult(null);
      setError(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-primary-200 bg-primary-50/70 p-3 text-sm text-foreground-800">
        <div className="flex items-start gap-2">
          <i className="ri-shield-check-line mt-0.5 text-primary-700"></i>
          <div>
            <div className="font-semibold text-foreground-950">{t('mh_char_source_title')}</div>
            <div className="mt-0.5 text-xs leading-relaxed text-foreground-650">
              {officialLookupSupported
                ? t('mh_char_source_official', { version: versionInfo.shortLabel })
                : t('mh_char_source_unsupported', { version: versionInfo.shortLabel })}
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-500 text-sm"></i>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setResult(null); setNotFound(false); setError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('mh_search_ign')}
            disabled={!officialLookupSupported}
            className="w-full h-11 pl-9 pr-4 rounded-lg border border-background-300 bg-background-50 text-sm outline-none focus:border-primary-500 disabled:bg-background-100 disabled:text-foreground-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !officialLookupSupported}
          className="h-11 px-5 rounded-lg bg-primary-500 text-background-50 dark:text-foreground-950 text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
        >
          {searching ? (
            <i className="ri-loader-4-line animate-spin"></i>
          ) : (
            t('mh_search_btn')
          )}
        </button>
      </div>

      {/* Recent searches */}
      {recentSearches.length > 0 && !result && !notFound && (
        <div>
          <div className="text-[11px] font-semibold text-foreground-500 uppercase tracking-wider mb-2">{t('mh_recent_searches')}</div>
          <div className="flex flex-wrap gap-1.5">
            {recentSearches.map((name) => (
              <button
                key={name}
                onClick={() => { setQuery(name); }}
                className="px-3 py-1.5 rounded-full bg-background-100 border border-background-200 text-xs text-foreground-600 hover:border-primary-300 hover:text-primary-600 cursor-pointer whitespace-nowrap transition-colors"
              >
                <i className="ri-time-line mr-1"></i>
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Not found state */}
      {notFound && (
        <div className="bg-background-100 border border-background-200 rounded-xl p-8 text-center">
          <i className="ri-user-unfollow-line text-4xl text-foreground-400 block mb-3"></i>
          <p className="text-sm text-foreground-600 font-semibold">{t('mh_char_not_found', { query })}</p>
          <p className="text-xs text-foreground-500 mt-1 mb-4">{t('mh_char_not_found_tip')}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <i className="ri-error-warning-line mr-1.5"></i>
          {t('mh_char_lookup_error')}
        </div>
      )}

      {/* Character result card */}
      {result && (
        <div className="bg-background-50 border border-background-200 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary-500 p-5 text-background-50 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-background-50/20 flex items-center justify-center text-2xl font-bold relative overflow-hidden">
              {result.characterImgURL ? (
                <img src={result.characterImgURL} alt={result.characterName} className="h-full w-full object-cover" />
              ) : (
                result.characterName[0]
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-secondary-500 flex items-center justify-center border-2 border-primary-500">
                <span className="text-[8px] font-bold text-background-50">{result.level.toString().slice(0, 2)}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold">{result.characterName}</h3>
              <p className="text-sm opacity-90 flex items-center gap-1">
                <i className="ri-map-pin-line text-xs"></i>
                {result.worldName || `World ${result.worldID}`} · {result.jobName}
              </p>
            </div>
            <span className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap`}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              {t('rankings_source_official')}
            </span>
          </div>

          {/* Stats grid */}
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background-100 rounded-lg">
              <div className="text-2xl font-bold text-primary-600">{result.level}</div>
              <div className="text-xs text-foreground-600 mt-0.5">{t('mh_char_level')}</div>
            </div>
            <div className="text-center p-3 bg-background-100 rounded-lg">
              <div className="text-2xl font-bold text-accent-600">{result.legionLevel.toLocaleString()}</div>
              <div className="text-xs text-foreground-600 mt-0.5">{t('mh_char_legion')}</div>
            </div>
            <div className="text-center p-3 bg-background-100 rounded-lg">
              <div className="text-2xl font-bold text-secondary-600">#{result.rank}</div>
              <div className="text-xs text-foreground-600 mt-0.5">{t('mh_char_rank')}</div>
            </div>
            <div className="text-center p-3 bg-background-100 rounded-lg">
              <div className="text-lg font-bold text-foreground-900">{result.raidPower.toLocaleString()}</div>
              <div className="text-xs text-foreground-600 mt-0.5">{t('rankings_raid_power')}</div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="text-xs font-semibold text-foreground-700 mb-2 flex items-center gap-1.5">
              <i className="ri-database-2-line text-secondary-500"></i>
              {t('mh_char_verified_fields')}
            </div>
            <p className="text-xs leading-relaxed text-foreground-600">
              {t('mh_char_verified_note')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
