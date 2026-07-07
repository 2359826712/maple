import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { mockCharacters } from '@/mocks/mapler-house';

interface StatEntry {
  label: string;
  base: number;
  buff: number;
  unit?: string;
}

type CharacterData = typeof mockCharacters[string];

function deriveStatsFromChar(char: CharacterData) {
  const scale = char.level / 292;
  return [
    { label: 'STR', base: Math.round(4210 * scale), buff: 380 },
    { label: 'DEX', base: Math.round(1220 * scale), buff: 60 },
    { label: 'HP', base: Math.round(84620 * scale), buff: 0 },
    { label: 'Attack Power', base: Math.round(6820 * scale), buff: 420 },
    { label: 'Boss Damage', base: Math.round(305 * scale), buff: 60, unit: '%' },
    { label: 'IED', base: Math.round(92 * scale * 10) / 10, buff: 5, unit: '%' },
  ];
}

export default function Simulators() {
  const { t } = useTranslation();
  const { versionInfo } = useVersion();
  const [buffs, setBuffs] = useState({ legion: true, familiar: true, guild: false, potion: true });
  const [stars, setStars] = useState(17);
  const [event, setEvent] = useState<'none' | 'sunny' | 'shining'>('sunny');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchedChar, setSearchedChar] = useState<CharacterData | null>(null);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [searching, setSearching] = useState(false);

  const character = searchedChar || mockCharacters['aurorakain'];
  const baseStats = useMemo(() => deriveStatsFromChar(character), [character]);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchNotFound(false);

    setTimeout(() => {
      const key = searchQuery.toLowerCase().replace(/\s+/g, '');
      const found = mockCharacters[key];
      if (found) {
        setSearchedChar(found);
        setSearchNotFound(false);
      } else {
        setSearchedChar(null);
        setSearchNotFound(true);
      }
      setSearching(false);
    }, 500);
  };

  const totalStat = useMemo(() => {
    return baseStats.reduce((acc, s) => acc + s.base + (buffs.legion ? s.buff * 0.4 : 0) + (buffs.familiar ? s.buff * 0.35 : 0) + (buffs.guild ? s.buff * 0.15 : 0) + (buffs.potion ? s.buff * 0.1 : 0), 0);
  }, [buffs, baseStats]);

  const successRate = useMemo(() => {
    const table = [95, 90, 85, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 30, 30, 30, 30, 30, 30, 30, 3, 2.1, 1.05][stars] ?? 30;
    let boost = 0;
    if (event === 'sunny') boost = 5;
    if (event === 'shining') boost = 10;
    return Math.min(100, table + boost);
  }, [stars, event]);

  const meanCost = useMemo(() => {
    const base = Math.pow(stars + 1, 2.7) * 2.4;
    const eventDiscount = event === 'sunny' ? 0.7 : event === 'shining' ? 0.5 : 1;
    return Math.round(base * eventDiscount);
  }, [stars, event]);

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
    return 'bg-background-100 text-foreground-600';
  };

  const initialChars = ['AuroraKain', 'LumiNite', 'SeaStorm', 'ShadowMage', 'DragonFist', 'ThunderGod'];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Character Lookup */}
        <div className="rounded-xl border border-background-200 bg-background-50 p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-primary-500 text-background-50 flex items-center justify-center">
                <i className="ri-user-star-line text-xl"></i>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground-950 text-lg">
                  {t('sim_char_lookup')}
                </h3>
                <div className="text-xs text-foreground-600">{versionInfo.shortLabel}</div>
              </div>
            </div>
            {searchedChar && (
              <span className="text-[11px] font-semibold text-primary-700 bg-primary-100 rounded-full px-2 py-1 whitespace-nowrap">
                {t('sim_char_live_preview')}
              </span>
            )}
          </div>

          {/* Search input */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-500 text-sm"></i>
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchNotFound(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('sim_search_placeholder')}
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-background-300 bg-background-50 text-sm outline-none focus:border-primary-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="h-10 px-4 rounded-lg bg-primary-500 text-background-50 dark:text-foreground-950 text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              {searching ? (
                <i className="ri-loader-4-line animate-spin"></i>
              ) : (
                t('sim_search_btn')
              )}
            </button>
          </div>

          {/* Not found */}
          {searchNotFound && (
            <div className="p-4 rounded-lg bg-background-100 border border-background-200 text-center mb-4">
              <p className="text-sm text-foreground-700 font-semibold">{t('sim_not_found')}</p>
              <p className="text-xs text-foreground-500 mt-1 mb-3">{t('sim_not_found_tip')}</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {initialChars.map((name) => (
                  <button
                    key={name}
                    onClick={() => { setSearchQuery(name); setSearchNotFound(false); }}
                    className="text-[11px] text-primary-600 hover:text-primary-700 bg-primary-50 rounded-full px-2.5 py-1 cursor-pointer whitespace-nowrap font-medium transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!searchedChar && !searchNotFound && searchQuery && searching && (
            <div className="p-8 rounded-lg bg-background-100 border border-background-200 text-center mb-4">
              <i className="ri-loader-4-line animate-spin text-2xl text-foreground-400 block mb-2"></i>
              <p className="text-sm text-foreground-600">{t('sim_searching')}</p>
            </div>
          )}

          {/* Tip when no search done */}
          {!searchedChar && !searchNotFound && !searchQuery && (
            <div className="p-4 rounded-lg bg-background-100 border border-background-200/70 mb-4 flex items-center gap-2">
              <i className="ri-information-line text-foreground-500 text-sm"></i>
              <span className="text-xs text-foreground-600">{t('sim_search_tip')}</span>
            </div>
          )}

          {/* Character card */}
          <div className="p-4 rounded-lg bg-background-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center font-heading font-semibold text-lg flex-shrink-0">
              {character.ign.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-heading font-semibold text-foreground-950 flex items-center gap-2">
                {character.ign}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${serverColor(character.server)}`}>
                  {serverAbbr(character.server)}
                </span>
              </div>
              <div className="text-xs text-foreground-600">{character.class} · {character.server.split(' ')[0]} · Guild: {character.guild}</div>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-foreground-700 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 font-semibold whitespace-nowrap">Lv. {character.level}</span>
                <span className="px-2 py-0.5 rounded-full bg-accent-100 text-accent-800 font-semibold whitespace-nowrap">Union {character.legion.toLocaleString()}</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-900 font-semibold whitespace-nowrap">Legion {character.legion.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {baseStats.map((s) => (
              <div key={s.label} className="p-3 rounded-md bg-background-100 border border-background-200/70">
                <div className="text-[10px] uppercase tracking-wide text-foreground-600">{s.label}</div>
                <div className="font-heading text-lg font-semibold text-foreground-950">
                  {(s.base + Math.round((buffs.legion ? s.buff * 0.4 : 0) + (buffs.familiar ? s.buff * 0.35 : 0) + (buffs.guild ? s.buff * 0.15 : 0) + (buffs.potion ? s.buff * 0.1 : 0))).toLocaleString()}
                  {s.unit || ''}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-background-100 flex items-center justify-between text-xs">
            <span className="text-foreground-700">{t('sim_char_overall')}</span>
            <span className="font-heading font-semibold text-primary-700 text-base">
              {totalStat.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: 'legion', label: t('sim_buff_legion') },
              { key: 'familiar', label: t('sim_buff_familiar') },
              { key: 'guild', label: t('sim_buff_guild') },
              { key: 'potion', label: t('sim_buff_potion') },
            ].map((b) => (
              <button
                key={b.key}
                onClick={() =>
                  setBuffs((s) => ({ ...s, [b.key]: !s[b.key as keyof typeof s] }))
                }
                className={`px-3 h-9 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  buffs[b.key as keyof typeof buffs]
                    ? 'bg-accent-500 text-background-50'
                    : 'bg-background-100 text-foreground-700 border border-background-200'
                }`}
              >
                {buffs[b.key as keyof typeof buffs] ? <i className="ri-check-line mr-1"></i> : null}
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Star Force Sim */}
        <div className="rounded-xl border border-background-200 bg-background-50 p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-secondary-500 text-background-50 flex items-center justify-center">
                <i className="ri-star-line text-xl"></i>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground-950 text-lg">
                  {t('sim_sf_title')}
                </h3>
                <div className="text-xs text-foreground-600">{t('sim_sf_sub')}</div>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-secondary-800 bg-secondary-100 rounded-full px-2 py-1">
              {t('sim_sf_demo')}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-1.5 flex-wrap">
            {Array.from({ length: 25 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setStars(i + 1)}
                className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                  i < stars
                    ? 'text-secondary-500 bg-secondary-100'
                    : 'text-foreground-300 bg-background-100'
                }`}
                aria-label={`${i + 1} stars`}
              >
                <i className="ri-star-fill text-xs"></i>
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-foreground-600">
            {t('sim_sf_current')} · <span className="font-semibold text-foreground-900">{stars}★ → {stars + 1}★</span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {(['none', 'sunny', 'shining'] as const).map((e) => (
              <button
                key={e}
                onClick={() => setEvent(e)}
                className={`h-11 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                  event === e
                    ? 'bg-primary-500 text-background-50'
                    : 'bg-background-100 text-foreground-700 border border-background-200'
                }`}
              >
                {e === 'none' ? t('sim_sf_no_event') : e === 'sunny' ? t('sim_sf_sunny') : t('sim_sf_shining')}
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-accent-100 border border-accent-200">
              <div className="text-[11px] text-accent-900 uppercase tracking-wider">{t('sim_sf_rate')}</div>
              <div className="font-heading text-3xl font-semibold text-accent-900">
                {successRate.toFixed(2)}%
              </div>
            </div>
            <div className="p-4 rounded-lg bg-primary-100 border border-primary-200">
              <div className="text-[11px] text-primary-900 uppercase tracking-wider">{t('sim_sf_mesos')}</div>
              <div className="font-heading text-3xl font-semibold text-primary-900">
                {meanCost.toLocaleString()}M
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button className="flex-1 h-10 rounded-md bg-secondary-500 hover:bg-secondary-600 text-background-50 dark:text-foreground-950 text-sm font-semibold cursor-pointer whitespace-nowrap">
              <i className="ri-play-circle-line mr-1"></i>
              {t('sim_sf_run')}
            </button>
            <button className="h-10 px-4 rounded-md bg-background-100 hover:bg-background-200 text-foreground-800 text-sm font-semibold cursor-pointer whitespace-nowrap">
              {t('sim_sf_reset')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}