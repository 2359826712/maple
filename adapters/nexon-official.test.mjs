import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { nexonCmsAdapter } from './nexon-cms/index.mjs';
import { nexonCommunityAdapter } from './nexon-community/index.mjs';
import { repositoryRoot } from '../scripts/lib/resource-index.mjs';

const fixtureDirectory = path.join(repositoryRoot, 'tests', 'fixtures', 'content');
const fixture = (name) => readFile(path.join(fixtureDirectory, name), 'utf8');
const result = (body, url = 'https://api.example.com/content') => ({
  requestUrl: url,
  finalUrl: url,
  status: 200,
  contentType: 'application/json',
  etag: null,
  lastModified: null,
  fetchedAt: '2026-07-18T12:00:00Z',
  body,
});

const baseSource = {
  id: 'fixture-source',
  name: 'Official Fixture Source',
  series: 'maplestory',
  regions: ['global'],
  languages: ['en'],
  content_types: ['cash-shop', 'event', 'maintenance', 'news', 'patch-note'],
  api_url: 'https://api.example.com/content',
  discovery_urls: ['https://example.com/news'],
  adapter_config: { default_content_type: 'news' },
  official: true,
  storage_mode: 'summary-and-metadata',
  parser: 'fixture-parser',
};

describe('Nexon official adapters', () => {
  it('separates mainline and Classic CMS records and keeps no source body', async () => {
    const [listing, detail] = await Promise.all([fixture('nexon-cms-list.json'), fixture('nexon-cms-detail.json')]);
    const source = { ...baseSource, id: 'maplestory-gms-official-news' };
    const context = { now: '2026-07-18T12:00:00Z', source, fetch: vi.fn().mockResolvedValue(result(listing)) };
    const items = await nexonCmsAdapter.discover(source, context);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ externalId: '42797', title: 'Maple Memo: Fixture Notice' });

    const fetched = { ...result(detail), discoveredItem: items[0] };
    const parsed = await nexonCmsAdapter.parse(fetched, context);
    const records = await nexonCmsAdapter.normalize(parsed[0], source, context);
    expect(records[0]).toMatchObject({
      body_text: null,
      body_markdown: null,
      content_type: 'news',
      external_id: '42797',
      subcategory: 'general',
    });
    expect(records[0].summary).not.toContain('Source summary');
    expect(records[0].summary).not.toContain('published this');
    expect(records[0].summary).toContain('2026-07-16');
  });

  it('extracts a confirmed UTC event period from the Worlds community API', async () => {
    const [listing, detail] = await Promise.all([fixture('nexon-worlds-list.json'), fixture('nexon-worlds-detail.json')]);
    const source = {
      ...baseSource,
      id: 'worlds-creator-center-news',
      name: 'MapleStory Worlds Creator Center News',
      series: 'worlds',
      content_types: ['creator-announcement', 'event', 'maintenance', 'news', 'patch-note'],
      adapter_config: {
        board_id: '5485', canonical_template: 'https://example.com/{threadId}', community_type: 5, mode: 'worlds', page_size: 5,
      },
    };
    const context = {
      now: '2026-07-18T12:00:00Z', source,
      fetch: vi.fn().mockResolvedValueOnce(result(listing)).mockResolvedValueOnce(result(detail)),
    };
    const [item] = await nexonCommunityAdapter.discover(source, context);
    const fetched = await nexonCommunityAdapter.fetch(item, context);
    const [parsed] = await nexonCommunityAdapter.parse(fetched, context);
    const [record] = await nexonCommunityAdapter.normalize(parsed, source, context);
    expect(record).toMatchObject({
      content_type: 'event',
      event_start: '2026-07-02T05:00:00.000Z',
      event_end: '2026-10-07T14:59:00.000Z',
      timezone: 'UTC',
    });
    expect(record.metadata.parser_warnings).toEqual([]);
    expect(record.summary).not.toContain('published this');
    expect(record.summary).toContain('2026-07-02');
  });

  it('reads current MapleStory N notices with the configured public headers', async () => {
    const [listing, detail] = await Promise.all([fixture('nexon-n-list.json'), fixture('nexon-n-detail.json')]);
    const source = {
      ...baseSource,
      id: 'n-official-documentation-announcements',
      name: 'MapleStory N Official Notices',
      series: 'n',
      content_types: ['event', 'maintenance', 'news', 'patch-note'],
      adapter_config: {
        board_id: '5288', canonical_template: 'https://msu.io/maplestoryn/news/notices/{threadId}',
        headers: { 'community-id': '500', 'x-inface-api-key': 'public-key' }, mode: 'n', page_size: 5,
      },
    };
    const fetchMock = vi.fn().mockResolvedValueOnce(result(listing)).mockResolvedValueOnce(result(detail));
    const context = { now: '2026-07-18T12:00:00Z', source, fetch: fetchMock };
    const [item] = await nexonCommunityAdapter.discover(source, context);
    const fetched = await nexonCommunityAdapter.fetch(item, context);
    const [parsed] = await nexonCommunityAdapter.parse(fetched, context);
    expect(item.url).toBe('https://msu.io/maplestoryn/news/notices/3500515');
    expect(parsed.contentType).toBe('news');
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ 'community-id': '500' });
  });
});
