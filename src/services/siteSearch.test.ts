// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { getSiteSearchResults } from './siteSearch';

describe('universal site search index', () => {
  beforeEach(() => localStorage.clear());

  it('finds core navigation even when realtime caches are empty', () => {
    const results = getSiteSearchResults('checklist', 'en', 'gms');
    expect(results).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'route-checklist', href: '/checklist' }),
    ]));
  });

  it('finds the upcoming updates destination', () => {
    const results = getSiteSearchResults('upcoming updates', 'en', 'gms');
    expect(results).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'route-upcoming', href: '/upcoming' }),
    ]));
  });

  it('finds generated series resources and keeps navigation on this site', () => {
    const results = getSiteSearchResults('Guide for New Maplers', 'en', 'gms');
    expect(results).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'resource-m-nexon-guide-for-new-maplers',
        href: expect.stringMatching(/^\/content\/guides\/.+\?series=maplestory-m$/),
      }),
    ]));
  });

  it.each([
    ['Miracle Summer 2026', /^\/content\/events\/.+\?series=maplestory-pc$/],
    ['MapleStory N Beginner', /^\/content\/guides\/.+\?series=maplestory-n$/],
    ['Managing Resources', /^\/content\/guides\/.+\?series=maplestory-worlds$/],
    ['MapleStory Idle RPG FAQ', /^\/content\/wiki\/.+\?series=maplestory-idle$/],
  ])('routes generated resource search for %s through an internal detail page', (query, href) => {
    const result = getSiteSearchResults(query, 'en', 'gms')
      .find((entry) => entry.id.startsWith('resource-'));
    expect(result?.href).toMatch(href);
  });

  it.each([
    ['zh', '每日 Boss 清单'],
    ['ja', 'デイリーボスチェックリスト'],
    ['ko', '일일 보스 체크리스트'],
    ['zh-Hant', '每日 Boss 清單'],
  ])('returns localized static route titles for %s', (language, title) => {
    const results = getSiteSearchResults('checklist', language, 'gms');
    expect(results.find((result) => result.id === 'route-checklist')?.title).toBe(title);
  });

  it('keeps character lookup outside the content result domain', () => {
    expect(getSiteSearchResults('DefinitelyNotAContentRecordIGN', 'en', 'gms')).toEqual([]);
  });

  it('uses per-difficulty periods in boss result summaries', () => {
    const zakum = getSiteSearchResults('Zakum', 'en', 'gms').find((result) => result.id === 'boss-zakum');
    expect(zakum?.excerpt).toContain('daily / weekly');
  });
});
