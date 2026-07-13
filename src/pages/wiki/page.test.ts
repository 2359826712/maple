import { describe, expect, it } from 'vitest';
import en from '@/i18n/local/en/common';
import zh from '@/i18n/local/zh/common';
import ja from '@/i18n/local/ja/common';
import ko from '@/i18n/local/ko/common';
import zhHant from '@/i18n/local/zh-Hant/common';
import { popularWikiItems, previewSections } from './page';

describe('wiki landing localization', () => {
  it('defines every data-driven article and preview key in every locale', () => {
    const locales = [en, zh, ja, ko, zhHant] as Array<Record<string, string>>;
    for (const locale of locales) {
      for (const item of popularWikiItems) {
        expect(locale[`wiki_art_${item.i18nKey}`]).toBeTruthy();
        expect(locale[`wiki_art_${item.i18nKey}_desc`]).toBeTruthy();
      }
      for (const section of previewSections) {
        expect(locale[`wiki_prev_${section.i18nKey}`]).toBeTruthy();
        expect(locale[`wiki_prev_${section.i18nKey}_body`]).toBeTruthy();
      }
    }
  });
});
