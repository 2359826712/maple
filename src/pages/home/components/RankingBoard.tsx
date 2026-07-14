import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchNexonRankings,
  isRankingVersionSupported,
  rankingBoards,
  rankingWorlds,
  type NexonRankingRow,
  type RankingBoardKey,
  type RankingWorldKey,
} from '@/services/nexonRankings';
import OfficialServerLinks from '@/components/feature/OfficialServerLinks';
import { useVersion, VERSIONS, type GameVersion } from '@/hooks/VersionContext';

type RankingTrend = 'up' | 'down' | 'flat';

type DisplayRank = NexonRankingRow & {
  worldName: string;
};

const rankingThemes: Record<GameVersion, {
  accent: string;
  board: string;
  header: string;
  row: string;
  footer: string;
  button: string;
  podium: [string, string, string];
}> = {
  gms: {
    accent: 'text-emerald-700',
    board: 'border-emerald-200 bg-white shadow-sm',
    header: 'bg-gradient-to-r from-emerald-950 to-emerald-800 text-emerald-50',
    row: 'border-emerald-100 hover:bg-emerald-50/70',
    footer: 'border-emerald-100 bg-emerald-50/60',
    button: 'border-emerald-200 bg-white text-emerald-800 hover:border-emerald-400 hover:bg-emerald-50',
    podium: ['bg-emerald-700 text-white', 'bg-slate-300 text-slate-900', 'bg-amber-200 text-amber-950'],
  },
  kms: {
    accent: 'text-blue-700',
    board: 'border-blue-200 bg-white shadow-[0_12px_35px_rgba(30,64,175,0.08)]',
    header: 'bg-gradient-to-r from-slate-950 via-blue-950 to-blue-900 text-blue-50',
    row: 'border-blue-100 hover:bg-blue-50/70',
    footer: 'border-blue-100 bg-blue-50/60',
    button: 'border-blue-200 bg-white text-blue-800 hover:border-blue-400 hover:bg-blue-50',
    podium: ['bg-amber-400 text-slate-950', 'bg-slate-300 text-slate-900', 'bg-orange-300 text-orange-950'],
  },
  jms: {
    accent: 'text-rose-700',
    board: 'border-rose-200 bg-white shadow-[0_12px_35px_rgba(190,24,93,0.07)]',
    header: 'bg-gradient-to-r from-rose-800 via-red-700 to-orange-600 text-white',
    row: 'border-rose-100 hover:bg-rose-50/70',
    footer: 'border-rose-100 bg-rose-50/60',
    button: 'border-rose-200 bg-white text-rose-800 hover:border-rose-400 hover:bg-rose-50',
    podium: ['bg-rose-700 text-white', 'bg-slate-300 text-slate-900', 'bg-orange-300 text-orange-950'],
  },
  tms: {
    accent: 'text-amber-800',
    board: 'border-amber-300 bg-white shadow-[0_12px_35px_rgba(180,83,9,0.08)]',
    header: 'bg-gradient-to-r from-amber-900 via-orange-800 to-orange-600 text-amber-50',
    row: 'border-amber-100 hover:bg-amber-50/80',
    footer: 'border-amber-100 bg-amber-50/70',
    button: 'border-amber-300 bg-white text-amber-900 hover:border-amber-500 hover:bg-amber-50',
    podium: ['bg-amber-500 text-amber-950', 'bg-slate-300 text-slate-900', 'bg-orange-300 text-orange-950'],
  },
  msea: {
    accent: 'text-foreground-700',
    board: 'border-background-200 bg-background-50',
    header: 'bg-background-100 text-foreground-600',
    row: 'border-background-200/70 hover:bg-background-100',
    footer: 'border-background-200 bg-background-100',
    button: 'border-background-300 bg-background-50 text-foreground-700 hover:border-primary-300 hover:text-primary-700',
    podium: ['bg-primary-500 text-background-50', 'bg-secondary-400 text-secondary-950', 'bg-accent-400 text-accent-950'],
  },
};

const trendIcon: Record<RankingTrend, string> = {
  up: 'ri-arrow-up-line text-accent-600',
  down: 'ri-arrow-down-line text-primary-600',
  flat: 'ri-subtract-line text-foreground-500',
};

function formatCompact(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function getTrend(row: DisplayRank): { trend: RankingTrend; labelKey: string; delta?: number } {
  if (!row.startRank) {
    return { trend: 'flat', labelKey: 'rankings_source_official' };
  }

  if (row.startRank === row.rank) {
    return { trend: 'flat', labelKey: 'rankings_no_change' };
  }

  if (row.rank < row.startRank) {
    return { trend: 'up', labelKey: 'rankings_up_week', delta: row.startRank - row.rank };
  }

  return { trend: 'down', labelKey: 'rankings_down_week', delta: row.rank - row.startRank };
}

interface RankingBoardProps {
  headingLevel?: 'h1' | 'h2';
}

export default function RankingBoard({ headingLevel = 'h2' }: RankingBoardProps) {
  const { t, i18n } = useTranslation();
  const { version, versionInfo, setVersion } = useVersion();
  const [world, setWorld] = useState<RankingWorldKey>('all');
  const [board, setBoard] = useState<RankingBoardKey>('overall');
  const [ranks, setRanks] = useState<DisplayRank[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const rankingSupported = isRankingVersionSupported(version);
  const usesGmsFilters = version === 'gms';
  const theme = rankingThemes[version];
  const Heading = headingLevel;

  useEffect(() => {
    if (!rankingSupported) {
      setRanks([]);
      setPageCount(1);
      setTotalCount(0);
      setHasNext(false);
      setError('');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    fetchNexonRankings({ version, board, world, page, signal: controller.signal, language: i18n.language })
      .then((data) => {
        setRanks(data.ranks);
        setPageCount(data.pageCount);
        setTotalCount(data.totalCount);
        setHasNext(data.hasNext);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return;
        }
        setRanks([]);
        setError(t('rankings_error'));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [board, i18n.language, page, rankingSupported, reloadKey, t, version, world]);

  const handleBoardChange = (nextBoard: RankingBoardKey) => {
    setBoard(nextBoard);
    setPage(1);
    if (nextBoard !== 'overall' && world === 'all') {
      setWorld('kronos');
    }
  };

  const handleVersionChange = (nextVersion: GameVersion) => {
    setPage(1);
    setBoard('overall');
    setWorld('all');
    setVersion(nextVersion);
  };

  const getMetric = (rank: DisplayRank) => {
    if (board === 'legion' || version === 'tms') {
      if (rank.raidPower > 0) {
        return `${t('rankings_raid_power')} ${formatCompact(rank.raidPower)}`;
      }

      if (rank.legionLevel > 0) {
        return `${t('rankings_legion_level')} ${rank.legionLevel.toLocaleString()}`;
      }
    }

    if (rank.gap > 0) {
      return `EXP +${formatCompact(rank.gap)}`;
    }

    return t('rankings_source_official');
  };

  return (
    <section id="rankings" className="py-14 md:py-20 bg-background-50">
      <div className="w-full px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${theme.accent}`}>
              <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
              {t('rankings_title_eyebrow')}
            </div>
            <Heading className="mt-2 font-heading text-2xl md:text-4xl font-semibold text-foreground-950">
              {t('rankings_title')}
            </Heading>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={version}
              onChange={(event) => handleVersionChange(event.target.value as GameVersion)}
              className="h-10 px-3 rounded-full border border-background-300 bg-background-50 text-sm text-foreground-800 pr-8 outline-none focus:border-primary-400 cursor-pointer"
              aria-label={t('rankings_version_label')}
            >
              {VERSIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.shortLabel}
                </option>
              ))}
            </select>
            {usesGmsFilters && (
              <>
                <select
                  value={world}
                  onChange={(event) => { setWorld(event.target.value as RankingWorldKey); setPage(1); }}
                  className="h-10 px-3 rounded-full border border-background-300 bg-background-50 text-sm text-foreground-800 pr-8 outline-none focus:border-primary-400 cursor-pointer"
                  disabled={!rankingSupported}
                >
                  {rankingWorlds.map((option) => (
                    <option key={option.key} value={option.key} disabled={board !== 'overall' && option.key === 'all'}>
                      {option.key === 'all' ? t('rankings_worlds_all') : option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={board}
                  onChange={(event) => handleBoardChange(event.target.value as RankingBoardKey)}
                  className="h-10 px-3 rounded-full border border-background-300 bg-background-50 text-sm text-foreground-800 pr-8 outline-none focus:border-primary-400 cursor-pointer"
                  disabled={!rankingSupported}
                >
                  {rankingBoards.map((option) => (
                    <option key={option.key} value={option.key}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        <div className="mb-5">
          <OfficialServerLinks preferred="rankings" />
        </div>

        <div>
          <div data-ranking-server={version} className={`overflow-hidden rounded-xl border ${theme.board}`}>
            <div className={`grid grid-cols-12 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider ${theme.header}`}>
              <div className="col-span-1">#</div>
              <div className="col-span-4">Character</div>
              <div className="col-span-3">Class · World</div>
              <div className="col-span-2 text-right">Level</div>
              <div className="col-span-2 text-right">
                {version === 'tms' ? t('rankings_raid_power') : version === 'kms' ? 'EXP' : t('rankings_metric')}
              </div>
            </div>

            {!rankingSupported ? (
              <div className="px-5 py-12 text-center text-sm text-foreground-600">
                {t('rankings_unsupported_version', { version: versionInfo.shortLabel })}
              </div>
            ) : isLoading ? (
              <div className="px-5 py-12 text-center text-sm text-foreground-600">
                <i className="ri-loader-4-line mr-2 animate-spin"></i>
                {t('rankings_loading')}
              </div>
            ) : error ? (
              <div className="px-5 py-12 text-center">
                <div className="text-sm text-foreground-700">{error}</div>
                <button
                  onClick={() => setReloadKey((key) => key + 1)}
                  className="mt-3 h-9 px-4 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold cursor-pointer"
                >
                  {t('rankings_retry')}
                </button>
              </div>
            ) : ranks.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-foreground-600">
                {t('rankings_empty')}
              </div>
            ) : (
              <>
                <ul>
                  {ranks.map((rank) => {
                  const movement = getTrend(rank);

                  return (
                    <li
                      key={`${rank.rank}-${rank.characterName}-${rank.worldID}`}
                      className={`grid grid-cols-12 items-center border-t px-5 py-3.5 transition-colors ${theme.row}`}
                    >
                      <div className="col-span-1">
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center font-heading font-semibold text-sm ${
                            rank.rank === 1
                              ? theme.podium[0]
                              : rank.rank === 2
                                ? theme.podium[1]
                                : rank.rank === 3
                                  ? theme.podium[2]
                                  : 'bg-background-100 text-foreground-700'
                          }`}
                        >
                          {rank.rank}
                        </div>
                      </div>
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary-200 text-primary-800 font-semibold text-sm flex items-center justify-center overflow-hidden shrink-0">
                          {rank.characterImgURL ? (
                            <img
                              src={rank.characterImgURL}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            rank.characterName[0]
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-heading font-semibold text-sm text-foreground-950 truncate">
                            {rank.characterName}
                          </div>
                          <div className="text-[11px] text-foreground-600 flex items-center gap-1">
                            <i className={trendIcon[movement.trend]}></i>
                            {movement.delta ? `${movement.delta} ${t(movement.labelKey)}` : t(movement.labelKey)}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3 text-sm text-foreground-800 truncate">
                        {rank.jobName} · <span className="text-foreground-600">{rank.worldName}</span>
                      </div>
                      <div className="col-span-2 text-right font-heading font-semibold text-foreground-950">
                        Lv. {rank.level}
                      </div>
                      <div className="col-span-2 text-right text-sm text-foreground-800">
                        {getMetric(rank)}
                      </div>
                    </li>
                  );
                  })}
                </ul>
                <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 ${theme.footer}`}>
                  <div className="text-xs font-medium text-foreground-600">
                    {t('rankings_page_status', { page })}{pageCount > 1 ? ` / ${pageCount}` : ''}
                    {totalCount > 0 && (
                      <span className="ml-2">{t('rankings_total_count', { count: totalCount.toLocaleString() })}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page <= 1 || isLoading}
                      className={`inline-flex h-9 items-center gap-1 rounded-full border px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${theme.button}`}
                    >
                      <i className="ri-arrow-left-s-line" aria-hidden="true" />
                      {t('rankings_previous')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((current) => current + 1)}
                      disabled={(!hasNext && page >= pageCount) || isLoading}
                      className={`inline-flex h-9 items-center gap-1 rounded-full border px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${theme.button}`}
                    >
                      {t('rankings_next')}
                      <i className="ri-arrow-right-s-line" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
