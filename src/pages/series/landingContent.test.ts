import { describe, expect, it } from 'vitest';
import type { GameVersion } from '@/domain/regionModel';
import { seriesProducts } from './catalog';
import {
  getSeriesLandingKeywords,
  getSeriesLandingPlainText,
  getSeriesLandingProfile,
} from './landingContent';
import { getSeriesVersions } from './versionConfig';

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

describe('series edition landing content', () => {
  it('builds a substantial SSR guide for every supported series and edition', () => {
    const profiles = seriesProducts.flatMap((product) => (
      getSeriesVersions(product.id).map(({ id }) => getSeriesLandingProfile(product.id, id))
    ));

    expect(profiles).toHaveLength(15);
    profiles.forEach((profile) => {
      expect(profile).toBeDefined();
      const words = countWords(getSeriesLandingPlainText(profile!));
      expect(words, `${profile!.seriesName} ${profile!.editionLabel}`).toBeGreaterThanOrEqual(1_400);
      expect(words, `${profile!.seriesName} ${profile!.editionLabel}`).toBeLessThanOrEqual(1_900);
      expect(profile!.sections).toHaveLength(6);
      expect(profile!.faq).toHaveLength(6);
    });
  });

  it('rejects editions that do not exist for a series', () => {
    expect(getSeriesLandingProfile('maplestory-classic', 'kms')).toBeUndefined();
    expect(getSeriesLandingProfile('maplestory-idle', 'tms')).toBeUndefined();
  });

  it('uses verified MapleStory demand without importing unrelated or private-server terms', () => {
    const validVersions: GameVersion[] = ['gms', 'kms', 'jms', 'tms', 'msea'];
    const searchableCopy = seriesProducts.flatMap((product) => (
      validVersions
        .map((version) => getSeriesLandingProfile(product.id, version))
        .filter((profile) => profile)
        .flatMap((profile) => getSeriesLandingKeywords(profile!))
    )).join(' ').toLowerCase();

    expect(searchableCopy).toContain('mystic frontier maplestory');
    expect(searchableCopy).toContain('maplestory classic beta');
    expect(searchableCopy).toContain('maplestory idle coupon');
    expect(searchableCopy).not.toContain('chronostory');
    expect(searchableCopy).not.toContain('ai news today');
    expect(searchableCopy).not.toContain('gpts');
  });

  it('keeps every landing title unique by product and edition', () => {
    const titles = seriesProducts.flatMap((product) => (
      getSeriesVersions(product.id).map(({ id }) => getSeriesLandingProfile(product.id, id)!.title)
    ));

    expect(new Set(titles).size).toBe(titles.length);
  });

  it('uses market-native product names and search behavior instead of literal translation', () => {
    const simplified = getSeriesLandingProfile('maplestory-pc', 'gms', 'zh')!;
    const traditional = getSeriesLandingProfile('maplestory-idle', 'gms', 'zh-Hant')!;
    const japanese = getSeriesLandingProfile('maplestory-m', 'jms', 'ja')!;
    const korean = getSeriesLandingProfile('maplestory-idle', 'gms', 'ko')!;

    expect(simplified.seriesName).toBe('冒险岛');
    expect(simplified.sections.map((section) => section.title).join(' ')).toContain('服务器');
    expect(traditional.aliases).toContain('楓之谷放置冒險記');
    expect(traditional.searchIntents.map((intent) => intent.phrase)).toContain('楓之谷放置冒險記序號');
    expect(japanese.seriesName).toBe('メイプルストーリーM');
    expect(korean.seriesName).toBe('메이플 키우기');
    expect(korean.sections.map((section) => section.paragraphs.join(' ')).join(' ')).toContain('한국 공식');
  });

  it('normalizes case variants and scopes ambiguous server abbreviations', () => {
    const english = getSeriesLandingProfile('maplestory-pc', 'gms', 'en')!;
    const korean = getSeriesLandingProfile('maplestory-pc', 'kms', 'ko')!;
    const keywords = getSeriesLandingKeywords(korean);

    expect(english.aliases).toEqual(expect.arrayContaining(['MapleStory', 'GMS MapleStory']));
    expect(keywords).toContain('KMS 메이플스토리');
    expect(new Set(keywords).size).toBe(keywords.length);
    expect(keywords).not.toContain('GMS');
    expect(keywords).not.toContain('KMS');
  });
});
