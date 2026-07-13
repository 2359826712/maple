import { describe, expect, it } from 'vitest';
import {
  gameVersions,
  daysUntilEventBoundary,
  formatServerDateRange,
  getOfficialContentUrl,
  getVersionDefinition,
  isAvailableInVersion,
  isGameVersion,
  millisecondsUntilReset,
  versionDefinitions,
} from './regionModel';

describe('region/version model', () => {
  it('defines reset rules for every supported version', () => {
    expect(versionDefinitions.map((version) => version.id)).toEqual(gameVersions);
    for (const version of gameVersions) {
      const definition = getVersionDefinition(version);
      expect(definition.id).toBe(version);
      expect(definition.utcOffset).toBeGreaterThanOrEqual(-12);
      expect(definition.utcOffset).toBeLessThanOrEqual(14);
      expect(definition.weeklyResetDay).toBeGreaterThanOrEqual(0);
      expect(definition.weeklyResetDay).toBeLessThanOrEqual(6);
    }
  });

  it.each(gameVersions)('recognizes %s and applies all-region records', (version) => {
    expect(isGameVersion(version)).toBe(true);
    expect(isAvailableInVersion(['all'], version)).toBe(true);
  });

  it.each(gameVersions)('only applies a %s record to that version', (version) => {
    expect(isAvailableInVersion([version], version)).toBe(true);
    for (const otherVersion of gameVersions.filter((candidate) => candidate !== version)) {
      expect(isAvailableInVersion([version], otherVersion)).toBe(false);
    }
  });

  it('rejects unknown versions', () => {
    expect(isGameVersion('ems')).toBe(false);
    expect(isGameVersion(null)).toBe(false);
  });

  it('keeps official destinations with the server definition', () => {
    expect(getOfficialContentUrl('kms', 'events')).toBe('https://maplestory.nexon.com/news/event');
    expect(getOfficialContentUrl('jms', 'news')).toBe('https://maplestory.nexon.co.jp/notice/news/');
    expect(getOfficialContentUrl('jms', 'website')).toBe('https://maplestory.nexon.co.jp/');
    expect(getOfficialContentUrl('tms', 'website')).toBe('https://maplestory.beanfun.com/main');
    expect(getOfficialContentUrl('msea', 'website')).toBe('https://www.maplesea.com/');
  });

  it('calculates reset countdowns using server time instead of the browser timezone', () => {
    const instant = Date.parse('2026-07-11T15:30:00.000Z');
    expect(millisecondsUntilReset('daily', 'gms', instant)).toBe(8.5 * 60 * 60 * 1000);
    expect(millisecondsUntilReset('daily', 'kms', instant)).toBe(23.5 * 60 * 60 * 1000);
    expect(millisecondsUntilReset('daily', 'msea', instant)).toBe(30 * 60 * 1000);
  });

  it('uses each version weekly reset weekday', () => {
    const gmsWednesday = Date.parse('2026-07-08T23:00:00.000Z');
    expect(millisecondsUntilReset('weekly', 'gms', gmsWednesday)).toBe(60 * 60 * 1000);

    const kmsTuesday = Date.parse('2026-07-07T14:00:00.000Z');
    expect(millisecondsUntilReset('weekly', 'kms', kmsTuesday)).toBe(60 * 60 * 1000);
  });

  it('formats event windows in the active version server timezone', () => {
    const start = '2026-07-11T15:00:00.000Z';
    const end = '2026-07-11T16:00:00.000Z';
    expect(formatServerDateRange(start, end, 'gms', 'en-US')).toContain('3:00');
    expect(formatServerDateRange(start, end, 'kms', 'en-US')).toContain('Jul 12');
  });

  it('counts toward the start for upcoming events and the end for active events', () => {
    const now = Date.parse('2026-07-11T00:00:00.000Z');
    expect(daysUntilEventBoundary('2026-07-13T00:00:00.000Z', '2026-07-15T00:00:00.000Z', now)).toBe(2);
    expect(daysUntilEventBoundary('2026-07-10T00:00:00.000Z', '2026-07-12T00:00:00.000Z', now)).toBe(1);
  });

  // --- F-04: cross-version reset verification ---

  it.each(gameVersions)('daily reset countdown is positive and < 24h for %s', (version) => {
    const now = Date.parse('2026-07-11T12:00:00.000Z');
    const ms = millisecondsUntilReset('daily', version, now);
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  it('calculates daily reset for JMS and TMS using distinct timezones', () => {
    // 2026-07-11T15:30:00Z = 00:30 JST+9, 23:30 CST+8, 23:30 TST+8
    const instant = Date.parse('2026-07-11T15:30:00.000Z');
    // JMS (UTC+9): server time 00:30 Jul 12 → 23.5h until next midnight
    expect(millisecondsUntilReset('daily', 'jms', instant)).toBe(23.5 * 60 * 60 * 1000);
    // TMS (UTC+8) → 0.5h
    expect(millisecondsUntilReset('daily', 'tms', instant)).toBe(0.5 * 60 * 60 * 1000);
  });

  it('uses Wednesday reset for MSEA/JMS/TMS (weeklyResetDay=3)', () => {
    // 2026-07-08 is a Wednesday; at 23:00 UTC, server time for UTC+8 is 07:00 Thu
    const wednesdayLateUtc = Date.parse('2026-07-08T23:00:00.000Z');
    // MSEA (UTC+8): server is already Thursday → next Wednesday is 6 days away
    const mseaMs = millisecondsUntilReset('weekly', 'msea', wednesdayLateUtc);
    expect(mseaMs).toBeGreaterThan(5 * 24 * 3600 * 1000);
    expect(mseaMs).toBeLessThanOrEqual(7 * 24 * 3600 * 1000);

    // JMS (UTC+9): server is already Thursday → same logic
    const jmsMs = millisecondsUntilReset('weekly', 'jms', wednesdayLateUtc);
    expect(jmsMs).toBeGreaterThan(5 * 24 * 3600 * 1000);
    expect(jmsMs).toBeLessThanOrEqual(7 * 24 * 3600 * 1000);
  });

  // --- F-04: formatServerDateRange across versions and locales ---

  const eventStart = '2026-07-11T15:00:00.000Z';
  const eventEnd = '2026-07-15T16:00:00.000Z';

  it.each(gameVersions)('formats an event window in %s server timezone', (version) => {
    const result = formatServerDateRange(eventStart, eventEnd, version, 'en-US');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    // Must contain date-like content (not empty, not an error)
    expect(result.length).toBeGreaterThan(5);
  });

  it('formats event dates in each supported locale', () => {
    const locales = ['en', 'zh', 'ja', 'ko', 'zh-Hant'] as const;
    for (const locale of locales) {
      const result = formatServerDateRange(eventStart, eventEnd, 'gms', locale);
      expect(result, `locale ${locale}`).toBeTruthy();
      expect(result.length, `locale ${locale}`).toBeGreaterThan(3);
    }
  });

  it('formats cross-locale x cross-version matrix without errors', () => {
    const locales = ['en', 'zh', 'ja', 'ko', 'zh-Hant'] as const;
    for (const version of gameVersions) {
      for (const locale of locales) {
        const result = formatServerDateRange(eventStart, eventEnd, version, locale);
        expect(result, `${version}/${locale}`).toBeTruthy();
      }
    }
  });

  it('renders KMS and JMS event times in their respective local timezones', () => {
    // 15:00 UTC = 00:00 KST+9, 00:00 JST+9 → both should show Jul 12
    const kmsResult = formatServerDateRange(eventStart, eventEnd, 'kms', 'en-US');
    const jmsResult = formatServerDateRange(eventStart, eventEnd, 'jms', 'en-US');
    expect(kmsResult).toContain('Jul 12');
    expect(jmsResult).toContain('Jul 12');

    // But MSEA/TMS (UTC+8) → 23:00 → still Jul 11
    const tmsResult = formatServerDateRange(eventStart, eventEnd, 'tms', 'en-US');
    expect(tmsResult).toContain('Jul 11');
  });
});
