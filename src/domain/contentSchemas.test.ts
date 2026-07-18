import { describe, expect, it } from 'vitest';
import {
  validateBossData,
  validateEventData,
  validateNewsData,
  validateToolData,
  validateWikiData,
} from './contentSchemas';
import { communityTools } from '@/mocks/communityTools';

const provenance = {
  source: 'Official MapleStory',
  sourceUrl: 'https://www.nexon.com/maplestory/',
  lastVerified: '2026-07-11T00:00:00.000Z',
};

describe('canonical content schemas', () => {
  it('accepts region-aware boss data with provenance', () => {
    expect(validateBossData({
      ...provenance,
      id: 'lotus',
      name: 'Lotus',
      level: 250,
      minLevel: 200,
      difficulties: ['Normal', 'Hard', 'Extreme'],
      resetType: 'weekly',
      regions: ['gms'],
    }).ok).toBe(true);
  });

  it('rejects mixed all-region scope and impossible event windows', () => {
    const result = validateEventData({
      ...provenance,
      id: 'event',
      title: 'Event',
      windowStart: '2026-08-01T00:00:00.000Z',
      windowEnd: '2026-07-01T00:00:00.000Z',
      regions: ['all', 'gms'],
      rewards: [],
    });
    expect(result.ok).toBe(false);
    if ('issues' in result) expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(['windowEnd', 'regions']));
  });

  it('rejects future news and unsafe source protocols', () => {
    expect(validateNewsData({
      id: 'future',
      title: 'Future',
      excerpt: 'Not published yet',
      author: 'MapleStory',
      publishedAt: '2999-01-01T00:00:00.000Z',
      category: 'General',
      regions: ['gms'],
      sourceUrl: 'javascript:alert(1)',
    }).ok).toBe(false);
  });

  it('accepts complete locale-keyed news translations and rejects partial translations', () => {
    const news = {
      id: 'kms-notice',
      title: '닉네임 옥션',
      excerpt: '닉네임 옥션 안내',
      author: '메이플스토리',
      publishedAt: '2026-07-01T00:00:00.000Z',
      category: 'General',
      regions: ['kms'],
      sourceUrl: 'https://maplestory.nexon.com/News/Notice/1',
      sourceLanguage: 'ko',
    };

    expect(validateNewsData({
      ...news,
      translations: { zh: { title: '角色名拍卖', excerpt: '角色名拍卖活动公告' } },
    }).ok).toBe(true);
    expect(validateNewsData({
      ...news,
      translations: { zh: { title: '角色名拍卖' } },
    }).ok).toBe(false);
  });

  it('accepts complete localized news editions and rejects editions without editorial metadata', () => {
    const news = {
      id: 'gms-maintenance',
      title: 'Scheduled maintenance completed',
      excerpt: 'Maintenance is complete.',
      author: 'MapleStory Global',
      publishedAt: '2026-07-09T00:00:00.000Z',
      category: 'Patch Notes',
      regions: ['gms'],
      sourceUrl: 'https://www.nexon.com/maplestory/news/maintenance/1',
      sourceLanguage: 'en',
    };

    expect(validateNewsData({
      ...news,
      localizedEditions: {
        zh: {
          title: '维护已完成',
          summary: '维护结束，玩家现可正常登录。',
          categoryLabel: '维护公告',
          actionLabel: '查看维护说明',
          searchTerms: ['维护完成', '登录'],
          editorialStatus: 'reviewed',
        },
      },
    }).ok).toBe(true);
    expect(validateNewsData({
      ...news,
      localizedEditions: {
        zh: {
          title: '维护已完成',
          summary: '维护结束，玩家现可正常登录。',
          categoryLabel: '维护公告',
          actionLabel: '查看维护说明',
        },
      },
    }).ok).toBe(false);
  });

  it('requires non-empty rendered wiki content', () => {
    expect(validateWikiData({
      title: 'Lotus',
      htmlContent: '',
      lastSynced: '2026-07-11T00:00:00.000Z',
      sourceUrl: 'https://maplestorywiki.net/wiki/Lotus',
      categories: ['Bosses'],
    }).ok).toBe(false);
  });

  it('accepts a curated HTTPS tool record', () => {
    expect(validateToolData({
      ...provenance,
      id: 'cube',
      name: 'Cube Calculator',
      href: 'https://example.com/cube',
      category: 'calculator',
      regions: ['all'],
    }).ok).toBe(true);
  });

  it('rejects unsafe tool links and unknown categories', () => {
    const result = validateToolData({
      ...provenance,
      id: 'unsafe',
      name: 'Unsafe tool',
      href: 'javascript:alert(1)',
      category: 'made-up',
      regions: ['all'],
    });
    expect(result.ok).toBe(false);
    if ('issues' in result) {
      expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(['href', 'category']));
    }
  });

  it('validates every player-facing tool and keeps IDs and links unique', () => {
    expect(communityTools.every((tool) => validateToolData(tool).ok)).toBe(true);
    expect(new Set(communityTools.map((tool) => tool.id)).size).toBe(communityTools.length);
    expect(new Set(communityTools.map((tool) => tool.href)).size).toBe(communityTools.length);
    expect(communityTools.every((tool) => tool.isActive)).toBe(true);
  });
});
