import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { mockCharacters } from '@/mocks/mapler-house';

export default function CharacterSearch() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<(typeof mockCharacters)[string] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('mh_recent_chars') : null;
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const versionChars = useMemo(
    () => Object.entries(mockCharacters).filter(([, c]) => c.version === version),
    [version],
  );

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearching(true);
    setNotFound(false);

    setTimeout(() => {
      const key = query.toLowerCase().replace(/\s+/g, '');
      const found = mockCharacters[key];
      if (found && found.version === version) {
        setResult(found);
        setNotFound(false);
        setRecentSearches((prev) => {
          const updated = [found.ign, ...prev.filter((s) => s !== found.ign)].slice(0, 5);
          localStorage.setItem('mh_recent_chars', JSON.stringify(updated));
          return updated;
        });
      } else {
        setResult(null);
        setNotFound(true);
      }
      setSearching(false);
    }, 600);
  };

  const serverAbbr = (s: string) => {
    if (s.includes('GMS')) return 'GMS';
    if (s.includes('KMS')) return 'KMS';
    if (s.includes('MSEA')) return 'MSEA';
    if (s.includes('TMS')) return 'TMS';
    if (s.includes('JMS')) return 'JMS';
    if (s.includes('CMS')) return 'CMS';
    return '';
  };

  const serverColor = (s: string) => {
    if (s.includes('GMS')) return 'bg-primary-100 text-primary-700';
    if (s.includes('KMS')) return 'bg-accent-100 text-accent-700';
    if (s.includes('MSEA')) return 'bg-secondary-100 text-secondary-700';
    if (s.includes('TMS')) return 'bg-red-100 text-red-700';
    if (s.includes('JMS')) return 'bg-pink-100 text-pink-700';
    if (s.includes('CMS')) return 'bg-orange-100 text-orange-700';
    return 'bg-background-100 text-foreground-600';
  };

  const suggestionNames = versionChars.slice(0, 6).map(([, c]) => c.ign);

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-500 text-sm"></i>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setResult(null); setNotFound(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('mh_search_ign')}
            className="w-full h-11 pl-9 pr-4 rounded-lg border border-background-300 bg-background-50 text-sm outline-none focus:border-primary-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
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
          {suggestionNames.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
              <span className="text-[10px] text-foreground-500">{t('mh_char_try')}</span>
              {suggestionNames.map((name) => (
                <button
                  key={name}
                  onClick={() => { setQuery(name); setNotFound(false); }}
                  className="text-[10px] text-primary-600 hover:text-primary-700 bg-primary-50 rounded-full px-2 py-0.5 cursor-pointer whitespace-nowrap font-medium"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Character result card */}
      {result && (
        <div className="bg-background-50 border border-background-200 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary-500 p-5 text-background-50 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-background-50/20 flex items-center justify-center text-2xl font-bold relative">
              {result.ign[0]}
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-secondary-500 flex items-center justify-center border-2 border-primary-500">
                <span className="text-[8px] font-bold text-background-50">{result.level.toString().slice(0, 2)}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold">{result.ign}</h3>
              <p className="text-sm opacity-90 flex items-center gap-1">
                <i className="ri-map-pin-line text-xs"></i>
                {result.server}
              </p>
            </div>
            <span className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap`}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              {serverAbbr(result.server)}
            </span>
          </div>

          {/* Stats grid */}
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background-100 rounded-lg">
              <div className="text-2xl font-bold text-primary-600">{result.level}</div>
              <div className="text-xs text-foreground-600 mt-0.5">{t('mh_char_level')}</div>
            </div>
            <div className="text-center p-3 bg-background-100 rounded-lg">
              <div className="text-2xl font-bold text-accent-600">{result.legion.toLocaleString()}</div>
              <div className="text-xs text-foreground-600 mt-0.5">{t('mh_char_legion')}</div>
            </div>
            <div className="text-center p-3 bg-background-100 rounded-lg">
              <div className="text-2xl font-bold text-secondary-600">{result.popularity.toLocaleString()}</div>
              <div className="text-xs text-foreground-600 mt-0.5">{t('mh_popularity')}</div>
            </div>
            <div className="text-center p-3 bg-background-100 rounded-lg">
              <div className="text-lg font-bold text-foreground-900">{result.guild}</div>
              <div className="text-xs text-foreground-600 mt-0.5">{t('mh_char_guild')}</div>
            </div>
          </div>

          {/* Achievements */}
          <div className="px-5 pb-5">
            <div className="text-xs font-semibold text-foreground-700 mb-2 flex items-center gap-1.5">
              <i className="ri-medal-line text-secondary-500"></i>
              {t('mh_char_achievements')}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.achievements.map((a) => (
                <span key={a} className="px-3 py-1.5 rounded-full bg-accent-100 text-accent-700 text-xs font-medium whitespace-nowrap">
                  <i className="ri-medal-line mr-1"></i>{a}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}