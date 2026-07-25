import { describe, expect, it } from 'vitest';
import type { IndexedContentRecord } from '@/domain/contentIndex';
import { indexedContent } from '@/domain/contentIndex';
import {
  findIndexedContentIn,
  getIndexedContentSections,
  getIndexedResourceSections,
} from './indexedContentDetail';

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

  it('provides detailed on-site sections for every published content record', () => {
    indexedContent
      .filter((record) => record.status !== 'removed')
      .forEach((record) => {
        const sections = getIndexedContentSections(record);
        expect(sections.length, record.id).toBeGreaterThan(0);
        expect(sections.every((section) => section.title && section.items.length > 0), record.id).toBe(true);
      });
  });

  it('turns summary-only reports into topical facts instead of a metadata overview', () => {
    const record = indexedContent.find((item) => item.id === 'classic-china-niameowdb-news-2026-07-16-second-cot-signups-open');
    expect(record).toBeTruthy();
    const sections = getIndexedContentSections(record);

    expect(sections.map((section) => section.title)).toEqual(expect.arrayContaining([
      'Eligibility and access',
      'Dates and schedule',
      'Gameplay, content, and systems',
      'Source and regional scope',
    ]));
    expect(sections.flatMap((section) => section.items).join(' ')).toContain('3rd job');
  });
});
