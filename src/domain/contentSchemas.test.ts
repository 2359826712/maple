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
