import { describe, expect, it } from 'vitest';
import type { IndexedContentRecord } from '@/domain/contentIndex';
import { findIndexedContentIn, getIndexedResourceSections } from './indexedContentDetail';

describe('indexed series content details', () => {
  it('matches canonical, source, and related URLs after normalization', () => {
    const record = {
      canonical_url: 'https://example.com/news/42',
      source_url: 'https://api.example.com/news/42',
      related_urls: ['https://example.com/campaign/?utm_source=index'],
      metadata: {},
    } as IndexedContentRecord;

    expect(findIndexedContentIn([record], undefined, undefined, 'https://EXAMPLE.com/campaign')).toBe(record);
  });

  it('prefers an exact content id when multiple records share one canonical article', () => {
    const sharedUrl = 'https://example.com/news/ren';
    const first = {
      id: 'ren-overview',
      canonical_url: sharedUrl,
      source_url: sharedUrl,
      related_urls: [],
      metadata: {},
    } as IndexedContentRecord;
    const target = {
      ...first,
      id: 'tracks-of-the-wanderer',
    } as IndexedContentRecord;

    expect(findIndexedContentIn(
      [first, target],
      'tracks-of-the-wanderer',
      undefined,
      sharedUrl,
    )).toBe(target);
  });

  it('builds factual sections for resource directories without article bodies', () => {
    const sections = getIndexedResourceSections({
      website: 'Nexon MapleStory',
      page: 'Official News',
      category: 'news',
      regions: ['north-america', 'europe'],
      languages: ['en'],
      mobile_support: 'responsive',
      login_required: false,
      status: 'active',
      last_checked: '2026-07-18',
      tags: ['official-news'],
      source_urls: ['https://www.nexon.com/maplestory/news'],
    });

    expect(sections).toHaveLength(3);
    expect(sections[0].items.join(' ')).toContain('north america, europe');
    expect(sections[2].items.join(' ')).toContain('last checked 2026-07-18');
  });
});
