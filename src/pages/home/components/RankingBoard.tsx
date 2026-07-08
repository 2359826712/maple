import { FormEvent, useEffect, useMemo, useState } from 'react';
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
import { useVersion, VERSIONS, type GameVersion } from '@/hooks/VersionContext';

type RankingTrend = 'up' | 'down' | 'flat';

type DisplayRank = NexonRankingRow & {
  worldName: string;
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
  if (!row.startRank || row.startRank === row.rank) {
    return { trend: 'flat', labelKey: 'rankings_no_change' };
  }

  if (row.rank < row.startRank) {
    return { trend: 'up', labelKey: 'rankings_up_week', delta: row.startRank - row.rank };
  }

  return { trend: 'down', labelKey: 'rankings_down_week', delta: row.rank - row.startRank };
}

export default function RankingBoard() {
  const { t } = useTranslation();
  const { version, versionInfo, setVersion } = useVersion();
  const [world, setWorld] = useState<RankingWorldKey>('all');
  const [board, setBoard] = useState<RankingBoardKey>('overall');
  const [searchInput, setSearchInput] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [ranks, setRanks] = useState<DisplayRank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const selectedBoard = useMemo(
    () => rankingBoards.find((option) => option.key === board) ?? rankingBoards[0],
    [board],
  );
  const rankingSupported = isRankingVersionSupported(version);

  useEffect(() => {
    if (!rankingSupported) {
      setRanks([]);
      setError('');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    fetchNexonRankings({ version, board, world, characterName, signal: controller.signal })
      .then((data) => {
        setRanks(data.ranks.slice(0, 10));
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
  }, [board, characterName, rankingSupported, reloadKey, t, version, world]);

  const handleBoardChange = (nextBoard: RankingBoardKey) => {
    setBoard(nextBoard);
    if (nextBoard !== 'overall' && world === 'all') {
      setWorld('kronos');
    }
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCharacterName(searchInput.trim());
  };

  const getMetric = (rank: DisplayRank) => {
    if (board === 'legion') {
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
            <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
              {t('rankings_title_eyebrow')}
            </div>
            <h2 className="mt-2 font-heading text-2xl md:text-4xl font-semibold text-foreground-950">
              {t('rankings_title')}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={version}
              onChange={(event) => setVersion(event.target.value as GameVersion)}
              className="h-10 px-3 rounded-full border border-background-300 bg-background-50 text-sm text-foreground-800 pr-8 outline-none focus:border-primary-400 cursor-pointer"
              aria-label={t('rankings_version_label')}
            >
              {VERSIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.shortLabel}
                </option>
              ))}
            </select>
            <select
              value={world}
              onChange={(event) => setWorld(event.target.value as RankingWorldKey)}
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-xl border border-background-200 bg-background-50 overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 bg-background-100 text-[11px] uppercase tracking-wider text-foreground-600 font-semibold">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Character</div>
              <div className="col-span-3">Class · World</div>
              <div className="col-span-2 text-right">Level</div>
              <div className="col-span-2 text-right">{t('rankings_metric')}</div>
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
              <ul>
                {ranks.map((rank) => {
                  const movement = getTrend(rank);

                  return (
                    <li
                      key={`${rank.rank}-${rank.characterName}-${rank.worldID}`}
                      className="grid grid-cols-12 px-5 py-3.5 items-center border-t border-background-200/70 hover:bg-background-100 transition-colors"
                    >
                      <div className="col-span-1">
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center font-heading font-semibold text-sm ${
                            rank.rank === 1
                              ? 'bg-primary-500 text-background-50'
                              : rank.rank === 2
                                ? 'bg-secondary-400 text-secondary-950'
                                : rank.rank === 3
                                  ? 'bg-accent-400 text-accent-950'
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
            )}
          </div>

          <div className="rounded-xl border border-background-200 bg-background-100 p-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary-500 text-background-50 flex items-center justify-center">
                <i className="ri-line-chart-line"></i>
              </div>
              <div>
                <div className="font-heading font-semibold text-foreground-950">{t('rankings_your_card')}</div>
                <div className="text-xs text-foreground-600">{t('rankings_track_hint')}</div>
              </div>
            </div>
            <form className="mt-5 space-y-3" onSubmit={handleSearch}>
              <label className="block">
                <span className="text-xs font-semibold text-foreground-700">IGN</span>
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={t('rankings_ign_placeholder')}
                  className="mt-1 w-full h-10 rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500"
                  disabled={!rankingSupported}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-foreground-700">World</span>
                <select
                  value={world === 'all' ? 'kronos' : world}
                  onChange={(event) => setWorld(event.target.value as RankingWorldKey)}
                  className="mt-1 w-full h-10 rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 cursor-pointer"
                  disabled={!rankingSupported}
                >
                  {rankingWorlds
                    .filter((option) => option.key !== 'all')
                    .map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>
              <button
                disabled={!rankingSupported}
                className="w-full h-10 rounded-md bg-secondary-500 hover:bg-secondary-600 disabled:bg-background-300 disabled:text-foreground-500 text-background-50 dark:text-foreground-950 text-sm font-semibold cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                <i className="ri-search-line mr-1"></i>
                {t('rankings_track_btn')}
              </button>
            </form>
            <div className="mt-5 p-3 rounded-lg bg-background-50 border border-background-200 text-xs text-foreground-700 flex items-start gap-2">
              <i className="ri-shield-check-line text-accent-600 mt-0.5"></i>
              <span>{t('rankings_api_note', { board: t(selectedBoard.labelKey), version: versionInfo.shortLabel })}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
