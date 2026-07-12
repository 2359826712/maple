import type { GameVersion } from '@/hooks/VersionContext';
import { cachedJsonFetch, realtimeCacheDurations } from './realtimeCache';

export type RankingBoardKey = 'overall' | 'world' | 'legion';
export type RankingWorldKey = 'all' | 'bera' | 'scania' | 'kronos' | 'hyperion';

export type NexonRankingRow = {
  characterID: number;
  characterName: string;
  exp: number;
  gap: number;
  level: number;
  rank: number;
  startRank: number;
  worldID: number;
  characterImgURL: string;
  jobName: string;
  legionLevel: number;
  raidPower: number;
};

type NexonRankingResponse = {
  totalCount: number;
  ranks: NexonRankingRow[];
};

type FetchNexonRankingsOptions = {
  version: GameVersion;
  board: RankingBoardKey;
  world: RankingWorldKey;
  characterName?: string;
  signal?: AbortSignal;
};

export const rankingWorlds: Array<{ key: RankingWorldKey; label: string; worldId?: number }> = [
  { key: 'all', label: 'All GMS North America Worlds' },
  { key: 'bera', label: 'Bera', worldId: 1 },
  { key: 'scania', label: 'Scania', worldId: 19 },
  { key: 'kronos', label: 'Kronos', worldId: 45 },
  { key: 'hyperion', label: 'Hyperion', worldId: 70 },
];

export const rankingBoards: Array<{ key: RankingBoardKey; labelKey: string }> = [
  { key: 'overall', labelKey: 'rankings_board_level' },
  { key: 'world', labelKey: 'rankings_board_world' },
  { key: 'legion', labelKey: 'rankings_board_legion' },
];

const worldNamesById: Record<number, string> = {
  1: 'Bera',
  19: 'Scania',
  45: 'Kronos',
  70: 'Hyperion',
};

const apiBase = import.meta.env.DEV
  ? '/api/maplestory/no-auth/ranking/v2'
  : 'https://www.nexon.com/api/maplestory/no-auth/ranking/v2';

const rankingRegionByVersion: Partial<Record<GameVersion, string>> = {
  gms: 'na',
};

export function isRankingVersionSupported(version: GameVersion) {
  return Boolean(rankingRegionByVersion[version]);
}

const fallbackWorld = rankingWorlds.find((world) => world.key === 'kronos')!;

function getSelectedWorld(worldKey: RankingWorldKey) {
  return rankingWorlds.find((world) => world.key === worldKey && world.worldId) ?? fallbackWorld;
}

function buildRankingParams({ board, world, characterName }: FetchNexonRankingsOptions) {
  const params = new URLSearchParams({ page_index: '1' });
  const selectedWorld = getSelectedWorld(world);

  if (board === 'legion') {
    params.set('type', 'legion');
    params.set('id', String(selectedWorld.worldId));
  } else if (board === 'world' || world !== 'all') {
    params.set('type', 'world');
    params.set('id', String(selectedWorld.worldId));
  } else {
    params.set('type', 'overall');
    params.set('id', 'weekly');
    params.set('reboot_index', '0');
  }

  const trimmedName = characterName?.trim();
  if (trimmedName) {
    params.set('character_name', trimmedName);
  }

  return params;
}

export async function fetchNexonRankings(options: FetchNexonRankingsOptions) {
  const region = rankingRegionByVersion[options.version];
  if (!region) {
    throw new Error(`Unsupported rankings version: ${options.version}`);
  }

  const params = buildRankingParams(options);
  const requestUrl = `${apiBase}/${region}?${params.toString()}`;
  const data = await cachedJsonFetch<NexonRankingResponse>(requestUrl, {
    cacheKey: `nexon-rankings:${region}:${params.toString()}`,
    freshMs: 2 * 60 * 1000,
    staleMs: realtimeCacheDurations.medium,
    requestInit: {
      headers: { Accept: 'application/json' },
      signal: options.signal,
    },
  });

  if (!Array.isArray(data.ranks)) {
    throw new Error('Nexon rankings response is missing ranks');
  }

  return {
    totalCount: data.totalCount,
    ranks: data.ranks.map((rank) => ({
      ...rank,
      worldName: worldNamesById[rank.worldID] ?? `World ${rank.worldID}`,
    })),
  };
}
