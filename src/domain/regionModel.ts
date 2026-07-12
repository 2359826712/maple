import type { Region } from './contentSchemas';

export const gameVersions = ['gms', 'kms', 'msea', 'jms', 'cms', 'tms'] as const;

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
}

export const versionDefinitions: readonly VersionDefinition[] = [
  { id: 'gms', name: 'GMS', fullName: 'Global MapleStory', region: 'Global', shortLabel: 'GMS', utcOffset: 0, weeklyResetDay: 4, timeZone: 'UTC' },
  { id: 'kms', name: 'KMS', fullName: '한국 메이플스토리', region: 'Korea', shortLabel: 'KMS', utcOffset: 9, weeklyResetDay: 3, timeZone: 'Asia/Seoul' },
  { id: 'msea', name: 'MSEA', fullName: 'MapleStory SEA', region: 'SE Asia', shortLabel: 'MSEA', utcOffset: 8, weeklyResetDay: 3, timeZone: 'Asia/Singapore' },
  { id: 'jms', name: 'JMS', fullName: '日本メイプルストーリー', region: 'Japan', shortLabel: 'JMS', utcOffset: 9, weeklyResetDay: 3, timeZone: 'Asia/Tokyo' },
  { id: 'cms', name: 'CMS', fullName: '冒险岛 online', region: 'China', shortLabel: 'CMS', utcOffset: 8, weeklyResetDay: 3, timeZone: 'Asia/Shanghai' },
  { id: 'tms', name: 'TMS', fullName: '新楓之谷', region: 'Taiwan', shortLabel: 'TMS', utcOffset: 8, weeklyResetDay: 3, timeZone: 'Asia/Taipei' },
] as const;

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
