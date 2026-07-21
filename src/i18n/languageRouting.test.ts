import { describe, expect, it } from 'vitest';
import {
  getPathLanguage,
  getPathServer,
  localizeHref,
  normalizeLanguage,
  stripLanguageSuffix,
  stripRouteSuffixes,
  withLanguageSuffix,
  withRouteSuffixes,
  withServerSuffix,
} from './languageRouting';

describe('language routing', () => {
  it.each([
    ['/en', 'en'],
    ['/news/zh', 'zh'],
    ['/guides/grandis-content-progression-guide/ja', 'ja'],
    ['/wiki/article/Monster_Park/ko', 'ko'],
    ['/rankings/zh-hant', 'zh-Hant'],
    ['/news/zh/GMS', 'zh'],
  ] as const)('reads the static language suffix from %s', (pathname, language) => {
    expect(getPathLanguage(pathname)).toBe(language);
  });

  it.each([
    ['/en/GMS', 'gms'],
    ['/news/zh/KMS', 'kms'],
    ['/guides/level/ja/JMS', 'jms'],
    ['/wiki/ko/MSEA', 'msea'],
  ] as const)('reads the static server suffix from %s', (pathname, server) => {
    expect(getPathServer(pathname)).toBe(server);
  });

  it('does not treat ordinary route segments as languages', () => {
    expect(getPathLanguage('/news')).toBeNull();
    expect(getPathLanguage('/wiki/article/English')).toBeNull();
  });

  it('replaces an existing suffix without changing the page path', () => {
    expect(withLanguageSuffix('/guides/grandis-content-progression-guide/en', 'zh-Hant'))
      .toBe('/guides/grandis-content-progression-guide/zh-hant');
    expect(stripLanguageSuffix('/news/ja')).toBe('/news');
    expect(stripLanguageSuffix('/news/ja/JMS')).toBe('/news/JMS');
    expect(stripRouteSuffixes('/news/ja/JMS')).toBe('/news');
  });

  it('uses a language-only URL for the home page', () => {
    expect(withLanguageSuffix('/', 'en')).toBe('/en');
    expect(withLanguageSuffix('/zh', 'ko')).toBe('/ko');
  });

  it('keeps language and server suffixes in a stable order', () => {
    expect(withRouteSuffixes('/', 'en', 'gms')).toBe('/');
    expect(withRouteSuffixes('/', 'zh', 'gms')).toBe('/zh/GMS');
    expect(withRouteSuffixes('/news', 'zh-Hant', 'kms')).toBe('/news/zh-hant/KMS');
    expect(withServerSuffix('/news/ja/GMS', 'msea')).toBe('/news/ja/MSEA');
    expect(withLanguageSuffix('/news/en/GMS', 'ko')).toBe('/news/ko/GMS');
  });

  it('keeps search parameters and hashes after the language suffix', () => {
    expect(localizeHref('/mapler-house#stats', 'ja')).toBe('/mapler-house/ja#stats');
    expect(localizeHref('/search?q=lotus', 'zh')).toBe('/search/zh?q=lotus');
    expect(localizeHref('/news', 'en', 'gms')).toBe('/news/en/GMS');
    expect(localizeHref('/', 'en', 'gms')).toBe('/');
  });

  it('normalizes browser and i18next language variants', () => {
    expect(normalizeLanguage('zh-TW')).toBe('zh-Hant');
    expect(normalizeLanguage('ja-JP')).toBe('ja');
    expect(normalizeLanguage('unknown')).toBe('en');
  });
});
