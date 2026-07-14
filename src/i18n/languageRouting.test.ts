import { describe, expect, it } from 'vitest';
import {
  getPathLanguage,
  localizeHref,
  normalizeLanguage,
  stripLanguageSuffix,
  withLanguageSuffix,
} from './languageRouting';

describe('language routing', () => {
  it.each([
    ['/en', 'en'],
    ['/news/zh', 'zh'],
    ['/guides/grandis-content-progression-guide/ja', 'ja'],
    ['/wiki/article/Monster_Park/ko', 'ko'],
    ['/rankings/zh-hant', 'zh-Hant'],
  ] as const)('reads the static language suffix from %s', (pathname, language) => {
    expect(getPathLanguage(pathname)).toBe(language);
  });

  it('does not treat ordinary route segments as languages', () => {
    expect(getPathLanguage('/news')).toBeNull();
    expect(getPathLanguage('/wiki/article/English')).toBeNull();
  });

  it('replaces an existing suffix without changing the page path', () => {
    expect(withLanguageSuffix('/guides/grandis-content-progression-guide/en', 'zh-Hant'))
      .toBe('/guides/grandis-content-progression-guide/zh-hant');
    expect(stripLanguageSuffix('/news/ja')).toBe('/news');
  });

  it('uses a language-only URL for the home page', () => {
    expect(withLanguageSuffix('/', 'en')).toBe('/en');
    expect(withLanguageSuffix('/zh', 'ko')).toBe('/ko');
  });

  it('keeps search parameters and hashes after the language suffix', () => {
    expect(localizeHref('/mapler-house#stats', 'ja')).toBe('/mapler-house/ja#stats');
    expect(localizeHref('/search?q=lotus', 'zh')).toBe('/search/zh?q=lotus');
  });

  it('normalizes browser and i18next language variants', () => {
    expect(normalizeLanguage('zh-TW')).toBe('zh-Hant');
    expect(normalizeLanguage('ja-JP')).toBe('ja');
    expect(normalizeLanguage('unknown')).toBe('en');
  });
});
