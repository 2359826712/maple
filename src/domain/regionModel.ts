import type { Region } from './contentSchemas';

export const gameVersions = ['gms', 'kms', 'jms', 'tms', 'msea'] as const;

export type GameVersion = (typeof gameVersions)[number];

export interface VersionDefinition {
  id: GameVersion;
  name: string;
  fullName: string;
  region: string;
  shortLabel: string;
  utcOffset: number;
  weeklyResetDay: number;
  timeZone: string;
  defaultLanguage: 'en' | 'ko' | 'ja' | 'zh-Hant';
  officialLinks: {
    website?: string;
    events?: string;
    news?: string;
    rankings?: string;
  };
}

export const versionDefinitions: readonly VersionDefinition[] = [
  {
    id: 'gms', name: 'GMS', fullName: 'Global MapleStory', region: 'NA / EU', shortLabel: 'GMS',
    utcOffset: 0, weeklyResetDay: 4, timeZone: 'UTC', defaultLanguage: 'en',
    officialLinks: {
      website: 'https://www.nexon.com/maplestory',
      events: 'https://www.nexon.com/maplestory/News/Events',
      news: 'https://forums.maplestory.nexon.net/categories/announcements',
      rankings: 'https://maplestory.nexon.net/rankings/overall-ranking/legendary',
    },
  },
  {
    id: 'kms', name: 'KMS', fullName: '한국 메이플스토리', region: 'Korea', shortLabel: 'KMS',
    utcOffset: 9, weeklyResetDay: 3, timeZone: 'Asia/Seoul', defaultLanguage: 'ko',
    officialLinks: {
      website: 'https://maplestory.nexon.com',
      events: 'https://maplestory.nexon.com/news/event',
      news: 'https://maplestory.nexon.com/news/notice',
      rankings: 'https://maplestory.nexon.com/N23Ranking/World/Total',
    },
  },
  {
    id: 'jms', name: 'JMS', fullName: '日本メイプルストーリー', region: 'Japan', shortLabel: 'JMS',
    utcOffset: 9, weeklyResetDay: 3, timeZone: 'Asia/Tokyo', defaultLanguage: 'ja',
    officialLinks: {
      website: 'https://maplestory.nexon.co.jp/',
      events: 'https://maplestory.nexon.co.jp/notice/event/',
      news: 'https://maplestory.nexon.co.jp/notice/news/',
      rankings: 'https://maplestory.nexon.co.jp/community/exp/ranking/',
    },
  },
  {
    id: 'tms', name: 'TMS', fullName: '新楓之谷', region: 'Taiwan', shortLabel: 'TMS',
    utcOffset: 8, weeklyResetDay: 3, timeZone: 'Asia/Taipei', defaultLanguage: 'zh-Hant',
    officialLinks: {
      website: 'https://maplestory.beanfun.com/main',
      rankings: 'https://maplestory-event.beanfun.com/UnionWebRank/Index',
    },
  },
  {
    id: 'msea', name: 'MSEA', fullName: 'MapleStorySEA', region: 'Southeast Asia', shortLabel: 'MSEA',
    utcOffset: 8, weeklyResetDay: 3, timeZone: 'Asia/Singapore', defaultLanguage: 'en',
    officialLinks: {
      website: 'https://www.maplesea.com/',
      events: 'https://www.maplesea.com/events/',
      news: 'https://www.maplesea.com/news/',
    },
  },
] as const;

export type OfficialContentKind = keyof VersionDefinition['officialLinks'];

/** Returns the most specific official destination available for a server. */
export function getOfficialContentUrl(version: GameVersion, kind: OfficialContentKind): string | undefined {
  const links = getVersionDefinition(version).officialLinks;
  return links[kind] ?? links.website;
}

export function isGameVersion(value: unknown): value is GameVersion {
  return typeof value === 'string' && gameVersions.includes(value as GameVersion);
}

export function getVersionDefinition(id: GameVersion): VersionDefinition {
  return versionDefinitions.find((version) => version.id === id) ?? versionDefinitions[0];
}

/** A record marked `all` is available in every supported game version. */
export function isAvailableInVersion(
  recordRegions: readonly (Region | string)[],
  version: GameVersion | string,
): boolean {
  return recordRegions.includes('all') || recordRegions.includes(version);
}

export function millisecondsUntilReset(
  type: 'daily' | 'weekly',
  version: GameVersion,
  nowMs = Date.now(),
): number {
  const definition = getVersionDefinition(version);
  const offsetMs = definition.utcOffset * 60 * 60 * 1000;
  const serverNow = new Date(nowMs + offsetMs);
  const resetAtServerTime = new Date(serverNow);
  resetAtServerTime.setUTCHours(0, 0, 0, 0);

  if (type === 'daily') {
    resetAtServerTime.setUTCDate(resetAtServerTime.getUTCDate() + 1);
  } else {
    let daysUntilReset = definition.weeklyResetDay - resetAtServerTime.getUTCDay();
    if (daysUntilReset <= 0) daysUntilReset += 7;
    resetAtServerTime.setUTCDate(resetAtServerTime.getUTCDate() + daysUntilReset);
  }

  const resetAtUtc = resetAtServerTime.getTime() - offsetMs;
  return resetAtUtc - nowMs;
}

/**
 * Returns a stable string identifier for the current daily reset period
 * in the server's timezone (e.g. "2026-07-11").
 */
export function getCurrentDailyPeriod(version: GameVersion, nowMs = Date.now()): string {
  const definition = getVersionDefinition(version);
  const offsetMs = definition.utcOffset * 3_600_000;
  const serverNow = new Date(nowMs + offsetMs);
  const y = serverNow.getUTCFullYear();
  const m = String(serverNow.getUTCMonth() + 1).padStart(2, '0');
  const d = String(serverNow.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns a stable string identifier for the current weekly reset period
 * in the server's timezone. The identifier is the date of the most recent
 * weekly reset day (e.g. "W-2026-07-09" for GMS Thursday reset).
 */
export function getCurrentWeeklyPeriod(version: GameVersion, nowMs = Date.now()): string {
  const definition = getVersionDefinition(version);
  const offsetMs = definition.utcOffset * 3_600_000;
  const serverNow = new Date(nowMs + offsetMs);
  const currentDay = serverNow.getUTCDay();
  let daysSinceReset = currentDay - definition.weeklyResetDay;
  if (daysSinceReset < 0) daysSinceReset += 7;
  const resetDate = new Date(serverNow);
  resetDate.setUTCDate(resetDate.getUTCDate() - daysSinceReset);
  resetDate.setUTCHours(0, 0, 0, 0);
  const y = resetDate.getUTCFullYear();
  const m = String(resetDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(resetDate.getUTCDate()).padStart(2, '0');
  return `W-${y}-${m}-${d}`;
}

export function formatServerDateRange(
  windowStart: string,
  windowEnd: string,
  version: GameVersion,
  locale = 'en',
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: getVersionDefinition(version).timeZone,
  });
  return formatter.formatRange(new Date(windowStart), new Date(windowEnd));
}

export function daysUntilEventBoundary(windowStart: string, windowEnd: string, nowMs = Date.now()): number {
  const startMs = Date.parse(windowStart);
  const endMs = Date.parse(windowEnd);
  const boundary = nowMs < startMs ? startMs : endMs;
  return Math.max(0, Math.ceil((boundary - nowMs) / 86_400_000));
}
