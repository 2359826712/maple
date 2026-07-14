import { describe, expect, it } from 'vitest';
import { getGoogleButtonLocale, getGoogleIdentityScriptUrl } from './googleIdentity';

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

describe('getGoogleIdentityScriptUrl', () => {
  it('forces the requested locale when loading Google Identity Services', () => {
    expect(getGoogleIdentityScriptUrl('en')).toBe('https://accounts.google.com/gsi/client?hl=en');
    expect(getGoogleIdentityScriptUrl('zh_TW')).toBe('https://accounts.google.com/gsi/client?hl=zh_TW');
  });
});
