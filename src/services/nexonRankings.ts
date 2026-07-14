import type { GameVersion } from '@/hooks/VersionContext';
import { apiEndpoint } from './apiEndpoint';
import { cachedJsonFetch, cachedTextFetch, realtimeCacheDurations } from './realtimeCache';
import { normalizeStaticContentLanguage, translateStaticTexts } from './staticTranslation';

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

export type RankingPage = {
  totalCount: number;
  page: number;
  pageCount: number;
  hasNext: boolean;
  ranks: Array<NexonRankingRow & { worldName: string }>;
};

type NexonRankingResponse = {
  totalCount: number;
  ranks: NexonRankingRow[];
};

type FetchNexonRankingsOptions = {
  version: GameVersion;
  board: RankingBoardKey;
  world: RankingWorldKey;
  page?: number;
  characterName?: string;
  signal?: AbortSignal;
  language?: string;
};

type TmsRankingRow = {
  rank: number;
  gameWorldId: number;
  gameWorldName: string;
  characterName: string;
  characterLookUrl: string;
  jobName: string;
  unionDPS: number;
  unionTotalLevel: number;
  unionLevel: number;
};

type TmsRankingResponse = {
  code: number;
  data?: {
    pageCount?: number;
    rankDatas?: TmsRankingRow[];
  };
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

const gmsApiBase = 'https://www.nexon.com/api/maplestory/no-auth/ranking/v2';

const supportedVersions = new Set<GameVersion>(['gms', 'kms', 'jms', 'tms']);

export function isRankingVersionSupported(version: GameVersion) {
  return supportedVersions.has(version);
}

const fallbackWorld = rankingWorlds.find((world) => world.key === 'kronos')!;

function getSelectedWorld(worldKey: RankingWorldKey) {
  return rankingWorlds.find((world) => world.key === worldKey && world.worldId) ?? fallbackWorld;
}

function normalizePage(page = 1) {
  return Math.max(1, Math.floor(page));
}

function buildGmsRankingParams({ board, world, characterName, page }: FetchNexonRankingsOptions) {
  const params = new URLSearchParams({ page_index: String(normalizePage(page)) });
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
  if (trimmedName) params.set('character_name', trimmedName);
  return params;
}

function numberFromText(value: string | null | undefined) {
  const normalized = (value || '').replace(/[^0-9-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function absoluteImageUrl(value: string | null | undefined, origin: string) {
  if (!value) return '';
  if (value.startsWith('//')) return `https:${value}`;
  try {
    return new URL(value, origin).toString();
  } catch {
    return '';
  }
}

function pageNumbersFromDocument(document: Document) {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>('a'))
    .flatMap((anchor) => {
      const hrefPage = anchor.getAttribute('href')?.match(/[?&]page=(\d+)/i)?.[1];
      const clickPage = anchor.getAttribute('onclick')?.match(/(?:UpdatePaging|OnPageChange)\((\d+)\)/i)?.[1];
      const value = Number(hrefPage || clickPage || 0);
      return value > 0 ? [value] : [];
    });
}

export function parseKmsRankingPage(html: string, page = 1): RankingPage {
  const currentPage = normalizePage(page);
  const document = new DOMParser().parseFromString(html, 'text/html');
  const htmlRanks = Array.from(document.querySelectorAll<HTMLTableRowElement>('.rank_table tbody tr'))
    .flatMap((row): RankingPage['ranks'] => {
      const cells = row.querySelectorAll<HTMLTableCellElement>('td');
      const characterAnchor = row.querySelector<HTMLAnchorElement>('td.left dl dt a');
      const characterName = characterAnchor?.textContent?.replace(/\s+/g, ' ').trim() || '';
      // The live KMS page currently emits class="'ranking_other'" and
      // class="'ranking_num'" (including quote characters), so exact class
      // selectors silently miss every row. Anchor rank detection to the first
      // cell and accept both the intended and malformed official markup.
      const rankCell = cells[0];
      const rank = numberFromText(rankCell?.querySelector('p[class*="ranking_other"]')?.textContent)
        || numberFromText(rankCell?.querySelector<HTMLImageElement>('img[alt$="등"]')?.alt)
        || numberFromText(rankCell?.textContent);
      if (!rank || !characterName || cells.length < 4) return [];

      const level = numberFromText(cells[2]?.textContent);
      const exp = numberFromText(cells[3]?.textContent);
      const image = row.querySelector<HTMLImageElement>('.char_img > img:not(.bg)');
      return [{
        characterID: rank,
        characterName,
        exp,
        gap: exp,
        level,
        rank,
        startRank: 0,
        worldID: 0,
        characterImgURL: absoluteImageUrl(image?.getAttribute('src'), 'https://maplestory.nexon.com/'),
        jobName: row.querySelector('td.left dl dd')?.textContent?.trim() || '',
        legionLevel: 0,
        raidPower: 0,
        worldName: 'KMS',
      }];
    });
  const markdownRanks = htmlRanks.length > 0 ? [] : html.split(/\r?\n/).flatMap((line): RankingPage['ranks'] => {
    if (!/^\|\s*(?:!\[|\d)/.test(line) || !/\|\s*Lv\.\s*\d+/i.test(line)) return [];
    const cells = line.split('|');
    if (cells.length < 7) return [];
    const rank = numberFromText(cells[1].match(/(\d+)등/)?.[1] || cells[1].match(/^\s*(\d+)/)?.[1]);
    const detailMatch = cells[2].match(/\/Common\/Character\/Detail\/([^?/)]+)[^)]*\)([^[]*)$/i);
    if (!rank || !detailMatch) return [];
    let characterName = detailMatch[1];
    try {
      characterName = decodeURIComponent(characterName);
    } catch {
      // Keep the encoded name if the official URL is malformed.
    }
    const avatar = cells[2].match(/!\[[^\]]*\]\((https:\/\/avatar\.maplestory\.nexon\.com\/[^)]+)\)/i)?.[1] || '';
    return [{
      characterID: rank,
      characterName,
      exp: numberFromText(cells[4]),
      gap: numberFromText(cells[4]),
      level: numberFromText(cells[3]),
      rank,
      startRank: 0,
      worldID: 0,
      characterImgURL: avatar,
      jobName: detailMatch[2].trim(),
      legionLevel: 0,
      raidPower: 0,
      worldName: 'KMS',
    }];
  });
  const ranks = htmlRanks.length > 0 ? htmlRanks : markdownRanks;
  const markdownPages = Array.from(html.matchAll(/[?&]page=(\d+)/gi), (match) => Number(match[1]));
  const availablePages = [...pageNumbersFromDocument(document), ...markdownPages];
  const pageCount = Math.max(currentPage, ...availablePages, ranks.length === 10 ? currentPage + 1 : currentPage);
  return { totalCount: 0, page: currentPage, pageCount, hasNext: ranks.length === 10, ranks };
}

export function parseJmsRankingPage(html: string, page = 1): RankingPage {
  const currentPage = normalizePage(page);
  const document = new DOMParser().parseFromString(html, 'text/html');
  const ranks = Array.from(document.querySelectorAll<HTMLElement>('#ranklist > li'))
    .flatMap((row): RankingPage['ranks'] => {
      const rankNode = row.querySelector<HTMLElement>('li[class*="rank-"]');
      const rank = numberFromText(rankNode?.textContent);
      const characterName = row.querySelector('.avatar span')?.textContent?.trim() || '';
      if (!rank || !characterName) return [];
      const image = row.querySelector<HTMLImageElement>('.avatar img');
      return [{
        characterID: rank,
        characterName,
        exp: 0,
        gap: 0,
        level: numberFromText(row.querySelector('.level')?.textContent),
        rank,
        startRank: 0,
        worldID: 0,
        characterImgURL: absoluteImageUrl(image?.getAttribute('src'), 'https://maplestory.nexon.co.jp/'),
        jobName: row.querySelector('.job')?.textContent?.trim() || '',
        legionLevel: 0,
        raidPower: 0,
        worldName: row.querySelector('.world')?.textContent?.trim() || 'JMS',
      }];
    });
  const availablePages = pageNumbersFromDocument(document);
  const pageCount = Math.max(currentPage, ...availablePages, ranks.length === 20 ? currentPage + 1 : currentPage);
  return { totalCount: 0, page: currentPage, pageCount, hasNext: ranks.length === 20, ranks };
}

export function normalizeTmsRankingPage(payload: TmsRankingResponse, page = 1): RankingPage {
  const currentPage = normalizePage(page);
  if (payload.code !== 1 || !Array.isArray(payload.data?.rankDatas)) {
    throw new Error('TMS rankings response is missing ranks');
  }
  const pageCount = Math.max(currentPage, Number(payload.data.pageCount) || currentPage);
  const ranks = payload.data.rankDatas.map((row) => ({
    characterID: row.rank,
    characterName: row.characterName,
    exp: 0,
    gap: 0,
    level: Number(row.unionLevel) || 0,
    rank: Number(row.rank) || 0,
    startRank: 0,
    worldID: Number(row.gameWorldId) || 0,
    characterImgURL: row.characterLookUrl || '',
    jobName: row.jobName || '',
    legionLevel: Number(row.unionTotalLevel) || 0,
    raidPower: Number(row.unionDPS) || 0,
    worldName: row.gameWorldName || 'TMS',
  }));
  return { totalCount: pageCount * 10, page: currentPage, pageCount, hasNext: currentPage < pageCount, ranks };
}

async function fetchGmsRankings(options: FetchNexonRankingsOptions): Promise<RankingPage> {
  const page = normalizePage(options.page);
  const params = buildGmsRankingParams(options);
  const requestUrl = `${gmsApiBase}/na?${params.toString()}`;
  const data = await cachedJsonFetch<NexonRankingResponse>(requestUrl, {
    cacheKey: `nexon-rankings:na:${params.toString()}`,
    freshMs: realtimeCacheDurations.refresh,
    staleMs: realtimeCacheDurations.medium,
    requestInit: { headers: { Accept: 'application/json' }, signal: options.signal },
  });
  if (!Array.isArray(data.ranks)) throw new Error('Nexon rankings response is missing ranks');
  const totalCount = Number(data.totalCount) || data.ranks.length;
  const pageCount = options.characterName ? 1 : Math.max(1, Math.ceil(totalCount / 10));
  return {
    totalCount,
    page,
    pageCount,
    hasNext: page < pageCount,
    ranks: data.ranks.map((rank) => ({
      ...rank,
      worldName: worldNamesById[rank.worldID] ?? `World ${rank.worldID}`,
    })),
  };
}

async function fetchRegionalText(url: string, cacheKey: string, signal?: AbortSignal) {
  return cachedTextFetch(url, {
    cacheKey,
    freshMs: realtimeCacheDurations.refresh,
    staleMs: realtimeCacheDurations.medium,
    timeoutMs: 50_000,
    requestInit: { signal },
  });
}

async function fetchKmsRankings(options: FetchNexonRankingsOptions) {
  const page = normalizePage(options.page);
  const html = await fetchRegionalText(
    apiEndpoint(`/official-content/kms/rankings?page=${page}`),
    `official-rankings:v2:kms:${page}`,
    options.signal,
  );
  return parseKmsRankingPage(html, page);
}

async function fetchJmsRankings(options: FetchNexonRankingsOptions) {
  const page = normalizePage(options.page);
  const html = await fetchRegionalText(
    apiEndpoint(`/official-content/jms/rankings?page=${page}`),
    `official-rankings:v2:jms:${page}`,
    options.signal,
  );
  return parseJmsRankingPage(html, page);
}

async function fetchTmsRankings(options: FetchNexonRankingsOptions) {
  const page = normalizePage(options.page);
  const rankType = options.board === 'world' ? 2 : options.board === 'legion' ? 3 : 1;
  const primaryUrl = apiEndpoint(`/official-content/tms/rankings?page=${page}&rankType=${rankType}`);
  const payload = await cachedJsonFetch<TmsRankingResponse>(primaryUrl, {
    cacheKey: `official-rankings:v2:tms:${rankType}:${page}`,
    freshMs: realtimeCacheDurations.refresh,
    staleMs: realtimeCacheDurations.medium,
    timeoutMs: 50_000,
    requestInit: { signal: options.signal },
  });
  return normalizeTmsRankingPage(payload, page);
}

export async function fetchNexonRankings(options: FetchNexonRankingsOptions) {
  if (!isRankingVersionSupported(options.version)) {
    throw new Error(`Unsupported rankings version: ${options.version}`);
  }
  const page = options.version === 'gms'
    ? await fetchGmsRankings(options)
    : options.version === 'kms'
      ? await fetchKmsRankings(options)
      : options.version === 'jms'
        ? await fetchJmsRankings(options)
        : await fetchTmsRankings(options);
  const sourceLanguage = options.version === 'kms' ? 'ko' : options.version === 'jms' ? 'ja' : options.version === 'tms' ? 'zh-Hant' : 'en';
  const targetLanguage = normalizeStaticContentLanguage(options.language || sourceLanguage);
  if (sourceLanguage === targetLanguage || page.ranks.length === 0) return page;

  const labels = Array.from(new Set(page.ranks.flatMap((rank) => [rank.jobName, rank.worldName]).filter(Boolean)));
  try {
    const translations = await translateStaticTexts(labels, targetLanguage, { sourceLanguage });
    const translatedBySource = new Map(labels.map((label, index) => [label, translations[index] || label]));
    return {
      ...page,
      ranks: page.ranks.map((rank) => ({
        ...rank,
        jobName: translatedBySource.get(rank.jobName) || rank.jobName,
        worldName: translatedBySource.get(rank.worldName) || rank.worldName,
      })),
    };
  } catch {
    return page;
  }
}
