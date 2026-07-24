import { describe, expect, it } from 'vitest';
import { supportedLanguages } from '@/i18n/languageRouting';
import {
  getHelpCenterKeywords,
  getHelpCenterProfile,
  getHelpTopicArticleProfile,
  getHelpTopicIds,
} from './helpContent';

describe('localized help center content', () => {
  it('ships a substantial, source-routed problem guide in every language', () => {
    supportedLanguages.forEach((language) => {
      const profile = getHelpCenterProfile(language);
      expect(profile.topics).toHaveLength(24);
      expect(new Set(profile.topics.map((topic) => topic.id)).size).toBe(24);
      expect(profile.topics.every((topic) => topic.answer.length >= 2)).toBe(true);
      expect(profile.topics.every((topic) => topic.steps.length >= 3)).toBe(true);
      expect(profile.topics.every((topic) => topic.href.startsWith('/'))).toBe(true);
    });
  });

  it('uses market-specific queries instead of translating one English list', () => {
    expect(getHelpCenterKeywords('en')).toContain('maplestory idle coupon redeem');
    expect(getHelpCenterKeywords('zh')).toContain('冒险岛怀旧服');
    expect(getHelpCenterKeywords('zh-Hant')).toContain('新楓之谷開不起來');
    expect(getHelpCenterKeywords('ja')).toContain('メイプルストーリー 職業');
    expect(getHelpCenterKeywords('ko')).toContain('메이플 스토리 닉네임 검색');
  });

  it('does not turn noisy or unsafe trend results into help targets', () => {
    const searchable = supportedLanguages
      .flatMap((language) => getHelpCenterKeywords(language))
      .join(' ')
      .toLowerCase();

    expect(searchable).not.toContain('chronostory');
    expect(searchable).not.toContain('gamepass');
    expect(searchable).not.toContain('instagram');
    expect(searchable).not.toContain('private server download');
  });

  it('provides indexable detail routes and full source-backed copy for verified topics', () => {
    expect(getHelpTopicIds()).toHaveLength(24);
    supportedLanguages.forEach((language) => {
      const coupon = getHelpTopicArticleProfile(language, 'idle-coupon');
      expect(coupon?.sections).toHaveLength(4);
      expect(coupon?.faq.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('gives every MapleStory series its own question set', () => {
    const topics = getHelpCenterProfile('en').topics;
    const seriesIds = [
      'maplestory-pc',
      'maplestory-classic',
      'maplestory-m',
      'maplestory-n',
      'maplestory-worlds',
      'maplestory-idle',
    ];

    seriesIds.forEach((seriesId) => {
      expect(topics.filter((topic) => topic.seriesId === seriesId).length, seriesId).toBeGreaterThanOrEqual(3);
    });
    expect(topics.find((topic) => topic.id === 'm-start')?.question).toContain('MapleStory M');
    expect(topics.find((topic) => topic.id === 'n-v-tracker')?.question).toContain('V Tracker');
    expect(topics.find((topic) => topic.id === 'worlds-performance')?.question).toContain('performance');
  });
});
