import { describe, expect, it } from 'vitest';
import { getGoogleButtonLocale } from './googleIdentity';

describe('getGoogleButtonLocale', () => {
  it.each([
    ['en', 'en'],
    ['zh', 'zh_CN'],
    ['zh-CN', 'zh_CN'],
    ['zh-Hant', 'zh_TW'],
    ['zh-TW', 'zh_TW'],
    ['ja', 'ja'],
    ['ko', 'ko'],
    ['unknown', 'en'],
  ])('maps %s to %s', (language, expected) => {
    expect(getGoogleButtonLocale(language)).toBe(expected);
  });
});
