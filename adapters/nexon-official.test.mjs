import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { nexonCmsAdapter } from './nexon-cms/index.mjs';
import { nexonCommunityAdapter } from './nexon-community/index.mjs';
import { repositoryRoot } from '../scripts/lib/resource-index.mjs';

const fixtureDirectory = path.join(repositoryRoot, 'tests', 'fixtures', 'content');
const fixture = (name) => readFile(path.join(fixtureDirectory, name), 'utf8');
const sourceFixture = async (name) => JSON.parse(await readFile(path.join(repositoryRoot, 'sources', 'n', name), 'utf8'));
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

  it('uses authoritative maintenance categories before cash-shop words and avoids broad update classification', async () => {
    const source = { ...baseSource, id: 'maplestory-gms-official-news' };
    const listing = JSON.stringify([
      { id: 1, name: 'Scheduled Cash Shop Maintenance', category: 'maintenance', liveDate: '2026-01-01T00:00:00Z' },
      { id: 2, name: 'Compensation for a Service Issue', category: 'general', liveDate: '2026-01-01T00:00:00Z' },
      { id: 3, name: 'v.300 Update Preview', category: 'update', liveDate: '2026-01-01T00:00:00Z' },
      { id: 4, name: 'Cash Shop Update', category: 'sale', liveDate: '2026-01-01T00:00:00Z' },
      { id: 5, name: 'Ride or Die Event Preview!', category: 'events', liveDate: '2026-01-01T00:00:00Z' },
      { id: 6, name: 'World Best Winners', category: 'events', liveDate: '2026-01-01T00:00:00Z' },
      { id: 7, name: 'Update on Reboot World Miracle Time Event', category: 'general', liveDate: '2026-01-01T00:00:00Z' },
    ]);
    const context = { source, fetch: vi.fn().mockResolvedValue(result(listing)) };
    const items = await nexonCmsAdapter.discover(source, context);
    expect(items.map((item) => item.metadata.content_type)).toEqual([
      'maintenance', 'news', 'news', 'cash-shop', 'news', 'news', 'news',
    ]);
  });

  it('extracts historical GMS event periods across maintenance and regional time formats', async () => {
    const source = { ...baseSource, id: 'maplestory-gms-official-news' };
    const cases = [
      {
        title: 'Regional Maintenance Event', publishedAt: '2025-07-01T00:00:00Z',
        body: 'PDT (UTC -7): Wednesday, July 16, 2025 (End of Maintenance) - Tuesday, August 26, 2025 4:59 PM',
        expected: { event_start: '2025-07-16', event_end: '2025-08-26T23:59:00.000Z' },
      },
      {
        title: 'World Leap Event', publishedAt: '2025-05-01T00:00:00Z',
        body: 'Event Period: June 11, 2025 (after the maintenance) - August 26, 2025 11:59 PM UTC',
        expected: { event_start: '2025-06-11', event_end: '2025-08-26T23:59:00.000Z' },
      },
      {
        title: 'Bounty Event', publishedAt: '2025-01-01T00:00:00Z',
        body: 'February 4, 2025 4:00 PM PST (UTC -8) - February 10, 2025 3:59 PM PST (UTC -8)',
        expected: { event_start: '2025-02-05T00:00:00.000Z', event_end: '2025-02-10T23:59:00.000Z' },
      },
      {
        title: 'Social Hashtag Event', publishedAt: '2025-10-24T16:00:00Z',
        body: 'Event Duration: 9:00 AM - 3:30 PM PDT on Saturday, October 25',
        expected: { event_start: '2025-10-25T16:00:00.000Z', event_end: '2025-10-25T22:30:00.000Z' },
      },
      {
        title: 'Ordinal Regional Event', publishedAt: '2024-04-09T16:35:00Z',
        body: 'PDT (UTC -7): Tuesday, April 9th, 2024 5:00 PM - Tuesday, April 30th, 2024 4:59 PM',
        expected: { event_start: '2024-04-10T00:00:00.000Z', event_end: '2024-04-30T23:59:00.000Z' },
      },
      {
        title: 'Cross-DST Event', publishedAt: '2023-10-31T17:24:00Z',
        body: 'PDT (UTC -7): Tuesday, October 31st at 5:00 PM - Tuesday, November 14th at 3:59 PM (PST)',
        expected: { event_start: '2023-11-01T00:00:00.000Z', event_end: '2023-11-14T23:59:00.000Z' },
      },
      {
        title: 'Inferred UTC Event', publishedAt: '2024-06-03T13:00:00Z',
        body: 'June 5th at 12:00 AM UTC - June 11th at 11:59 PM UTC',
        expected: { event_start: '2024-06-05T00:00:00.000Z', event_end: '2024-06-11T23:59:00.000Z' },
      },
      {
        title: 'Holiday Livestream Event', publishedAt: '2022-12-15T13:19:00Z',
        body: 'Join us on Friday, December 16th at 1:00 PM PT.',
        expected: { event_start: '2022-12-16T21:00:00.000Z', event_end: '2022-12-16T21:00:00.000Z' },
      },
    ];

    for (const [index, testCase] of cases.entries()) {
      const discoveredItem = {
        url: `https://example.com/events/${index}`,
        externalId: String(index),
        title: testCase.title,
        publishedAt: testCase.publishedAt,
        metadata: { category: 'events', content_type: 'event' },
      };
      const payload = JSON.stringify({
        id: index, name: testCase.title, liveDate: testCase.publishedAt,
        body: `<p>${testCase.body}</p>`,
      });
      const [parsed] = await nexonCmsAdapter.parse(
        { ...result(payload), discoveredItem }, { source, now: '2026-07-20T00:00:00Z' },
      );
      const [record] = await nexonCmsAdapter.normalize(parsed, source, { now: '2026-07-20T00:00:00Z' });
      expect(record).toMatchObject({ content_type: 'event', timezone: 'UTC', ...testCase.expected });
      expect(record.metadata.parser_warnings).toEqual([]);
      expect(record.metadata.event_date_evidence).toBe('official-body-text');
    }
  });

  it('splits the historical two-day Miracle Time schedule into stable world-group occurrences', async () => {
    const source = { ...baseSource, id: 'maplestory-gms-official-news' };
    const discoveredItem = {
      url: 'https://example.com/events/16217', externalId: '16217',
      title: 'Miracle Time - December 17 - 18!', publishedAt: '2022-12-12T18:05:00Z',
      metadata: { category: 'events', content_type: 'event' },
    };
    const payload = JSON.stringify({
      id: 16217, name: discoveredItem.title, liveDate: discoveredItem.publishedAt,
      body: '<p>Saturday, December 17, 2022 PST (UTC -8): 12:30 AM – 1:30 AM, 2:00 PM – 3:00 PM, and 7:00 PM – 8:00 PM</p><p>Sunday, December 18, 2022 PST (UTC -8): 12:30 AM – 1:30 AM, 2:00 PM – 3:00 PM, and 7:00 PM – 8:00 PM</p>',
    });
    const parsed = await nexonCmsAdapter.parse(
      { ...result(payload), discoveredItem }, { source, now: '2026-07-21T00:00:00Z' },
    );
    const records = (await Promise.all(parsed.map((entry) => nexonCmsAdapter.normalize(
      entry, source, { now: '2026-07-21T00:00:00Z' },
    )))).flat();
    expect(records.map((record) => ({
      external_id: record.external_id, event_start: record.event_start, event_end: record.event_end,
    }))).toEqual([
      {
        external_id: '16217:miracle-time-interactive-and-burning-worlds',
        event_start: '2022-12-17T08:30:00.000Z', event_end: '2022-12-18T04:00:00.000Z',
      },
      {
        external_id: '16217:miracle-time-reboot-world',
        event_start: '2022-12-18T08:30:00.000Z', event_end: '2022-12-19T04:00:00.000Z',
      },
    ]);
    expect(records.every((record) => record.metadata.parser_warnings.length === 0)).toBe(true);
  });

  it('keeps historical reward retrieval windows as claims instead of duplicate events', async () => {
    const source = { ...baseSource, id: 'maplestory-gms-official-news' };
    const discoveredItem = {
      url: 'https://example.com/events/5254', externalId: '5254', title: "World's Best Punch King",
      publishedAt: '2023-09-05T16:22:00Z', metadata: { category: 'events', content_type: 'event' },
    };
    const payload = JSON.stringify({
      id: 5254, name: discoveredItem.title, liveDate: discoveredItem.publishedAt,
      body: '<p><strong>Event Period:</strong></p><p>PDT (UTC -7): Tuesday, September 5th, 2023 5:00 PM - Tuesday, October 3rd, 2023 4:59 PM</p><p><strong>Reward Period:</strong></p><p>PDT (UTC -7): Tuesday, October 17th, 2023 5:00 PM - Tuesday, October 31st, 2023 4:59 PM</p>',
    });
    const parsed = await nexonCmsAdapter.parse(
      { ...result(payload), discoveredItem }, { source, now: '2026-07-21T00:00:00Z' },
    );
    expect(parsed).toHaveLength(1);
    const [record] = await nexonCmsAdapter.normalize(parsed[0], source, { now: '2026-07-21T00:00:00Z' });
    expect(record).toMatchObject({
      event_start: '2023-09-06T00:00:00.000Z', event_end: '2023-10-03T23:59:00.000Z',
      claim_start: '2023-10-18T00:00:00.000Z', claim_end: '2023-10-31T23:59:00.000Z',
    });
  });

  it('reproduces the official combined client-side CMS pagination without refetching each logical page', async () => {
    const [current, archived] = await Promise.all([
      fixture('nexon-cms-list.json'),
      fixture('nexon-cms-archived-list.json'),
    ]);
    const source = {
      ...baseSource,
      id: 'maplestory-gms-official-news',
      api_url: 'https://api.example.com/cms/v1/news',
      adapter_config: {
        default_content_type: 'news',
        pagination: {
          strategy: 'client-slice',
          endpoint_urls: [
            'https://api.example.com/cms/v1/news',
            'https://api.example.com/cms/v1/archived',
          ],
          page_size: 2,
          start: 1,
        },
      },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(result(current, 'https://api.example.com/cms/v1/news'))
      .mockResolvedValueOnce(result(archived, 'https://api.example.com/cms/v1/archived'));
    const context = { now: '2026-07-20T12:00:00Z', source, fetch: fetchMock };
    const pagination = await nexonCmsAdapter.discoverPages(source, context);
    const firstResult = await nexonCmsAdapter.fetchPage(pagination.firstPage, source, context);
    const firstItems = await nexonCmsAdapter.discoverItems(firstResult, pagination.firstPage, source, context);
    const next = await nexonCmsAdapter.discoverNextPage(pagination.firstPage, firstResult, firstItems, source, context);
    const secondResult = await nexonCmsAdapter.fetchPage(next.page, source, context);
    const secondItems = await nexonCmsAdapter.discoverItems(secondResult, next.page, source, context);
    const end = await nexonCmsAdapter.discoverNextPage(next.page, secondResult, secondItems, source, context);

    expect(firstResult.requestUrls).toEqual(source.adapter_config.pagination.endpoint_urls);
    expect(firstResult.pagination).toMatchObject({ pageSize: 2, totalItems: 4, totalPages: 2 });
    expect(firstItems.map((item) => item.externalId)).toEqual(['42797', '22379']);
    expect(secondItems.map((item) => item.externalId)).toEqual(['22378', '22377']);
    expect(next.page.previousLastExternalId).toBe('22379');
    expect(next.page.previousLastPublishedAt).toBe('2024-12-30T14:00:00Z');
    expect(firstItems.filter((item) => secondItems.some((other) => other.externalId === item.externalId))).toHaveLength(0);
    expect(end).toMatchObject({ page: null, reason: 'last-page', totalPages: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('anchors a resumed CMS page after the prior boundary when newer records shift static offsets', async () => {
    const [currentText, archived] = await Promise.all([
      fixture('nexon-cms-list.json'),
      fixture('nexon-cms-archived-list.json'),
    ]);
    const current = JSON.parse(currentText);
    current.unshift({
      ...current[0], id: 50000, name: 'Newer inserted notice', liveDate: '2026-07-21T00:00:00Z',
    });
    const source = {
      ...baseSource,
      id: 'maplestory-gms-official-news',
      adapter_config: {
        pagination: {
          strategy: 'client-slice',
          endpoint_urls: ['https://api.example.com/current', 'https://api.example.com/archive'],
          page_size: 2,
        },
      },
    };
    const context = {
      source,
      fetch: vi.fn()
        .mockResolvedValueOnce(result(JSON.stringify(current), 'https://api.example.com/current'))
        .mockResolvedValueOnce(result(archived, 'https://api.example.com/archive')),
    };
    const resumedPage = {
      index: 2,
      value: 2,
      url: 'https://api.example.com/current',
      requestUrls: source.adapter_config.pagination.endpoint_urls,
      previousLastExternalId: '22379',
      previousLastPublishedAt: '2024-12-30T14:00:00Z',
    };
    const pageResult = await nexonCmsAdapter.fetchPage(resumedPage, source, context);
    const items = await nexonCmsAdapter.discoverItems(pageResult, resumedPage, source, context);
    expect(items.map((item) => item.externalId)).toEqual(['22378', '22377']);
  });

  it('deduplicates an endpoint-boundary overlap before slicing and honors a configured page size', async () => {
    const [current, overlap] = await Promise.all([
      fixture('nexon-cms-list.json'),
      fixture('nexon-cms-overlap-list.json'),
    ]);
    const source = {
      ...baseSource,
      id: 'maplestory-gms-official-news',
      adapter_config: {
        pagination: {
          strategy: 'client-slice',
          endpoint_urls: ['https://api.example.com/current', 'https://api.example.com/archive'],
          page_size: 2,
        },
      },
    };
    const context = {
      source,
      fetch: vi.fn()
        .mockResolvedValueOnce(result(current, 'https://api.example.com/current'))
        .mockResolvedValueOnce(result(overlap, 'https://api.example.com/archive')),
    };
    const first = (await nexonCmsAdapter.discoverPages(source, context)).firstPage;
    const firstResult = await nexonCmsAdapter.fetchPage(first, source, context);
    const firstItems = await nexonCmsAdapter.discoverItems(firstResult, first, source, context);
    const next = await nexonCmsAdapter.discoverNextPage(first, firstResult, firstItems, source, context);
    const secondResult = await nexonCmsAdapter.fetchPage(next.page, source, context);
    const secondItems = await nexonCmsAdapter.discoverItems(secondResult, next.page, source, context);

    expect(firstResult.pagination).toMatchObject({ totalItems: 3, totalPages: 2 });
    expect(firstItems.map((item) => item.externalId)).toEqual(['42797', '22379']);
    expect(secondItems.map((item) => item.externalId)).toEqual(['22378']);
    expect(await nexonCmsAdapter.discoverNextPage(next.page, secondResult, secondItems, source, context))
      .toMatchObject({ page: null, reason: 'last-page' });
  });

  it('stops safely when both configured CMS pagination endpoints are empty', async () => {
    const empty = await fixture('nexon-cms-empty-list.json');
    const source = {
      ...baseSource,
      id: 'maplestory-gms-official-news',
      adapter_config: {
        pagination: {
          strategy: 'client-slice',
          endpoint_urls: ['https://api.example.com/current', 'https://api.example.com/archive'],
          page_size: 18,
        },
      },
    };
    const context = { source, fetch: vi.fn().mockResolvedValue(result(empty)) };
    const first = (await nexonCmsAdapter.discoverPages(source, context)).firstPage;
    const pageResult = await nexonCmsAdapter.fetchPage(first, source, context);
    const items = await nexonCmsAdapter.discoverItems(pageResult, first, source, context);
    expect(items).toEqual([]);
    expect(pageResult.pagination).toMatchObject({ totalItems: 0, totalPages: 0 });
    expect(await nexonCmsAdapter.discoverNextPage(first, pageResult, items, source, context))
      .toMatchObject({ page: null, reason: 'empty-page' });
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

  it('extracts confirmed historical Worlds challenge periods from official body text', async () => {
    const source = {
      ...baseSource,
      id: 'worlds-creator-center-news',
      name: 'MapleStory Worlds Creator Center News',
      series: 'worlds',
      content_types: ['creator-announcement', 'event', 'maintenance', 'news', 'patch-note'],
      adapter_config: { board_id: '5485', mode: 'worlds' },
    };
    const cases = [
      {
        id: '2744799',
        title: '[Updated 6/9 - Closed] Introducing The 90-Day Challenge',
        publishedAt: '2025-03-10T22:42:27.000Z',
        content: 'From March 10th to June 9th Creators can compete. Enter your submission by June 9 at 6:59 PM PT. How to submit: publish your World. Prizes: winners receive $500 USD.',
        expected: { event_start: '2025-03-10', event_end: '2025-06-09', timezone: 'America/Los_Angeles' },
      },
      {
        id: '2666583',
        title: '[Closed] Card Shuffle Challenge [Updated 11/18]',
        publishedAt: '2024-10-17T23:29:21.000Z',
        content: 'Create your World and submit it for prizes. Key Dates: Submissions open Nov. 1. Submissions close Nov. 17 at 11:59 PM Pacific Time.',
        expected: { event_start: '2024-11-01', event_end: '2024-11-17', timezone: 'America/Los_Angeles' },
      },
    ];

    for (const testCase of cases) {
      const discoveredItem = {
        url: `https://example.com/${testCase.id}`,
        externalId: testCase.id,
        title: testCase.title,
        publishedAt: testCase.publishedAt,
        metadata: { content_type: 'event', headline_id: '3480' },
      };
      const detail = JSON.stringify({
        data: {
          threadId: testCase.id,
          boardId: '5485',
          title: testCase.title,
          createDate: Date.parse(testCase.publishedAt) / 1000,
          content: testCase.content,
          headlineId: '3480',
          tags: null,
          user: { nickname: 'MSW_Creators' },
        },
      });
      const [parsed] = await nexonCommunityAdapter.parse({ ...result(detail), discoveredItem }, { now: '2026-07-20T12:00:00Z', source });
      const [record] = await nexonCommunityAdapter.normalize(parsed, source, { now: '2026-07-20T12:00:00Z' });
      expect(record).toMatchObject({ content_type: 'event', ...testCase.expected });
      expect(record.metadata.parser_warnings).toEqual([]);
      expect(record.metadata.event_date_evidence).toBe('official-body-text');
    }
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

  it('paginates Worlds with its returned keyset and resumes on a short last page', async () => {
    const [firstBody, stickyBody, secondBody] = await Promise.all([
      fixture('nexon-community-worlds-page-1.json'),
      fixture('nexon-community-worlds-sticky.json'),
      fixture('nexon-community-worlds-page-2.json'),
    ]);
    const source = {
      ...baseSource,
      id: 'worlds-creator-center-news',
      series: 'worlds',
      api_url: 'https://mverse-api.example.com/external/v1/community',
      content_types: ['creator-announcement', 'event', 'maintenance', 'news', 'patch-note'],
      adapter_config: {
        board_id: '5485', canonical_template: 'https://example.com/{threadId}', community_type: 5,
        mode: 'worlds', pagination: {
          strategy: 'nexon-keyset', page_size: 3, block_size: 3, include_sticky: true, sticky_page_size: 5,
        },
      },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(result(firstBody))
      .mockResolvedValueOnce(result(stickyBody))
      .mockResolvedValueOnce(result(secondBody));
    const context = { source, fetch: fetchMock };
    const pagination = await nexonCommunityAdapter.discoverPages(source);
    const firstResult = await nexonCommunityAdapter.fetchPage(pagination.firstPage, source, context);
    const firstItems = await nexonCommunityAdapter.discoverItems(firstResult, pagination.firstPage, source, context);
    const next = await nexonCommunityAdapter.discoverNextPage(
      pagination.firstPage, firstResult, firstItems, source, context,
    );
    const resumedPage = JSON.parse(JSON.stringify(next.page));
    const secondResult = await nexonCommunityAdapter.fetchPage(resumedPage, source, context);
    const secondItems = await nexonCommunityAdapter.discoverItems(secondResult, resumedPage, source, context);
    const end = await nexonCommunityAdapter.discoverNextPage(
      resumedPage, secondResult, secondItems, source, context,
    );

    expect(firstItems.map((item) => item.externalId)).toEqual(['1099', '1003', '1002', '1001']);
    expect(firstItems[0].metadata.is_sticky).toBe(true);
    expect(firstItems[2].publishedAt).toBe(firstItems[3].publishedAt);
    expect(resumedPage).toMatchObject({
      index: 2,
      cursor: '253402300799,9223372036854775807',
      blockStartKey: ['253402300799', '9223372036854775807'],
      blockStartNo: 1,
    });
    expect(secondItems.map((item) => item.externalId)).toEqual(['1001', '1000']);
    expect(new Set([...firstItems, ...secondItems].map((item) => item.externalId)).size).toBe(5);
    expect(end).toMatchObject({ page: null, reason: 'last-page', totalPages: 2 });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).endPoint).toContain('stickyThreads?pageSize=5');
    const secondRequest = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(secondRequest.endPoint).toContain('pageNo=2');
    expect(decodeURIComponent(secondRequest.endPoint)).toContain(
      'blockStartKey=253402300799,9223372036854775807',
    );
  });

  it('supports N pinned records, keyset resume, boundary duplicates, and stable external IDs', async () => {
    const [firstBody, secondBody] = await Promise.all([
      fixture('nexon-community-n-page-1.json'),
      fixture('nexon-community-n-page-2.json'),
    ]);
    const source = {
      ...baseSource,
      id: 'n-official-documentation-announcements',
      series: 'n',
      api_url: 'https://public.api.example.com/community-ext-api/api/v1',
      content_types: ['event', 'maintenance', 'news', 'patch-note'],
      adapter_config: {
        board_id: '5288', canonical_template: 'https://msu.io/maplestoryn/news/notices/{threadId}',
        headers: { 'community-id': '500', 'x-inface-api-key': 'public-fixture-key' }, mode: 'n',
        headline_type_map: { 5040: 'maintenance', 5041: 'patch-note', 5042: 'news', 5132: 'news' },
        classification_rules: [{
          content_type: 'news', headline_ids: ['5041'], title_pattern: 'known issues?',
          override_headline: true,
        }],
        pagination: {
          strategy: 'nexon-keyset', page_size: 3, block_size: 9,
          search_keyword_type: 'THREAD_TITLE_AND_CONTENT',
        },
      },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(result(firstBody))
      .mockResolvedValueOnce(result(secondBody));
    const context = { source, fetch: fetchMock };
    const first = (await nexonCommunityAdapter.discoverPages(source)).firstPage;
    const firstResult = await nexonCommunityAdapter.fetchPage(first, source, context);
    const firstItems = await nexonCommunityAdapter.discoverItems(firstResult, first, source, context);
    const next = await nexonCommunityAdapter.discoverNextPage(first, firstResult, firstItems, source, context);
    const secondResult = await nexonCommunityAdapter.fetchPage(next.page, source, context);
    const secondItems = await nexonCommunityAdapter.discoverItems(secondResult, next.page, source, context);

    expect(firstItems[0]).toMatchObject({ externalId: '2000', metadata: { is_sticky: true } });
    expect(firstItems.map((item) => item.metadata.content_type)).toEqual(['news', 'maintenance', 'news']);
    expect(secondItems.map((item) => item.externalId)).toEqual(['1998', '1997']);
    expect(secondItems[1].metadata.content_type).toBe('news');
    expect(new Set([...firstItems, ...secondItems].map((item) => item.externalId)).size).toBe(4);
    expect(fetchMock.mock.calls[1][0]).toContain('pageNo=2');
    expect(decodeURIComponent(fetchMock.mock.calls[1][0])).toContain(
      'blockStartKey=253402300799,9223372036854775807',
    );

    const detail = JSON.stringify({
      threadId: '1998', headlineId: '5041', title: 'Renamed Known Issues', content: '<p>Summary.</p>',
      createDate: 1783000200, user: { nickname: 'msnadmin' },
    });
    const [parsed] = await nexonCommunityAdapter.parse(
      { ...result(detail), discoveredItem: firstItems[2] }, { source },
    );
    const [original] = await nexonCommunityAdapter.normalize(
      parsed, source, { now: '2026-07-20T00:00:00Z' },
    );
    const [renamed] = await nexonCommunityAdapter.normalize(
      { ...parsed, title: 'Another title' }, source, { now: '2026-07-20T00:00:00Z' },
    );
    expect(renamed.id).toBe(original.id);
    expect(original.updated_at).toBeNull();
    expect(original.metadata.unconfirmed_fields).toContain('updated_at');
  });

  it('stops Nexon community backfill safely on an empty first page', async () => {
    const empty = await fixture('nexon-community-worlds-empty-page.json');
    const source = {
      ...baseSource,
      id: 'worlds-creator-center-news',
      series: 'worlds',
      adapter_config: {
        board_id: '5485', canonical_template: 'https://example.com/{threadId}', community_type: 5,
        mode: 'worlds', pagination: { strategy: 'nexon-keyset', page_size: 25, block_size: 25 },
      },
    };
    const context = { source, fetch: vi.fn().mockResolvedValue(result(empty)) };
    const first = (await nexonCommunityAdapter.discoverPages(source)).firstPage;
    const pageResult = await nexonCommunityAdapter.fetchPage(first, source, context);
    const items = await nexonCommunityAdapter.discoverItems(pageResult, first, source, context);
    expect(items).toEqual([]);
    expect(await nexonCommunityAdapter.discoverNextPage(first, pageResult, items, source, context))
      .toMatchObject({ page: null, reason: 'empty-page' });
  });

  it('splits independently named GMS events with stable occurrence IDs and UTC dates', async () => {
    const detail = await fixture('nexon-cms-multi-event-detail.json');
    const source = { ...baseSource, id: 'maplestory-gms-official-news' };
    const context = { now: '2026-07-20T12:00:00Z', source };
    const fetched = {
      ...result(detail),
      discoveredItem: {
        url: 'https://www.nexon.com/maplestory/news/events/42250/custom-portrait-events',
        externalId: '42250',
        title: 'Custom Portrait Events',
        publishedAt: '2026-07-01T17:00:00Z',
        metadata: { category: 'events', content_type: 'event' },
      },
    };

    const parsed = await nexonCmsAdapter.parse(fetched, context);
    const records = (await Promise.all(parsed.map((item) => nexonCmsAdapter.normalize(item, source, context)))).flat();
    expect(records).toHaveLength(2);
    expect(records.map((record) => ({
      title: record.title,
      external_id: record.external_id,
      event_start: record.event_start,
      event_end: record.event_end,
      claim_end: record.claim_end,
      timezone: record.timezone,
    }))).toEqual([
      {
        title: 'Prolific Portraitist',
        external_id: '42250:prolific-portraitist',
        event_start: '2026-07-02T00:00:00.000Z',
        event_end: '2026-07-05T23:59:00.000Z',
        claim_end: '2026-07-05T23:59:00.000Z',
        timezone: 'UTC',
      },
      {
        title: 'Chroma Essence',
        external_id: '42250:chroma-essence',
        event_start: '2026-07-09T00:00:00.000Z',
        event_end: '2026-07-22T23:59:00.000Z',
        claim_end: '2026-07-22T23:59:00.000Z',
        timezone: 'UTC',
      },
    ]);
    const renamed = await nexonCmsAdapter.normalize({ ...parsed[0], title: 'Renamed Event' }, source, context);
    expect(renamed[0].id).toBe(records[0].id);
  });

  it('parses historical regional, inferred-year, and scheduled UTC event ranges', async () => {
    const details = JSON.parse(await fixture('nexon-cms-historical-event-details.json'));
    const source = { ...baseSource, id: 'maplestory-gms-official-news' };
    const context = { now: '2026-07-20T12:00:00Z', source };
    for (const detail of details) {
      const item = {
        url: `https://www.nexon.com/maplestory/news/events/${detail.id}/fixture`,
        externalId: String(detail.id), title: detail.name, publishedAt: detail.liveDate,
        metadata: { category: 'events', content_type: 'event' },
      };
      const parsedItems = await nexonCmsAdapter.parse({ ...result(JSON.stringify(detail)), discoveredItem: item }, context);
      expect(parsedItems, detail.name).toHaveLength(1);
      const [parsed] = parsedItems;
      const [record] = await nexonCmsAdapter.normalize(parsed, source, context);
      expect(record, detail.name).toMatchObject({
        event_start: detail.expectedStart,
        event_end: detail.expectedEnd,
        shop_start: detail.expectedShopStart || null,
        shop_end: detail.expectedShopEnd || null,
        timezone: 'UTC',
      });
      expect(record.metadata.parser_warnings, detail.name).toEqual([]);
      expect(record.id, detail.name).toContain(String(detail.id));
    }
  });

  it('uses source-configured dates verified from an official image-only event body', async () => {
    const detail = JSON.parse(await fixture('nexon-cms-image-event-detail.json'));
    const source = {
      ...baseSource,
      id: 'maplestory-gms-official-news',
      adapter_config: {
        event_date_overrides: {
          '36565': {
            event_start: '2026-03-18', event_end: '2026-04-14T23:59:00.000Z',
            timezone: 'UTC', evidence: 'official-body-image',
          },
        },
      },
    };
    const context = { now: '2026-07-20T12:00:00Z', source };
    const item = {
      url: 'https://www.nexon.com/maplestory/news/events/36565/limited-time-job-play-as-saitama',
      externalId: '36565', title: detail.name, publishedAt: detail.liveDate,
      metadata: { category: 'events', content_type: 'event' },
    };
    const [parsed] = await nexonCmsAdapter.parse({ ...result(JSON.stringify(detail)), discoveredItem: item }, context);
    const [record] = await nexonCmsAdapter.normalize(parsed, source, context);
    expect(record).toMatchObject({
      event_start: '2026-03-18', event_end: '2026-04-14T23:59:00.000Z', timezone: 'UTC',
      metadata: { event_date_evidence: 'official-body-image', parser_warnings: [] },
    });
  });

  it('does not classify a Worlds creator campaign guide as an event', async () => {
    const detail = await fixture('nexon-worlds-creator-campaign-detail.json');
    const source = {
      ...baseSource,
      id: 'worlds-creator-center-news',
      series: 'worlds',
      content_types: ['creator-announcement', 'event', 'maintenance', 'news', 'patch-note'],
      adapter_config: { mode: 'worlds' },
    };
    const context = { now: '2026-07-20T12:00:00Z', source };
    const fetched = {
      ...result(detail),
      discoveredItem: {
        url: 'https://example.com/3482038', externalId: '3482038',
        title: 'Create a World Trustworthy to Players &amp; Creators', publishedAt: '2026-06-25T06:00:00Z',
        metadata: { content_type: 'creator-announcement', headline_id: '3479' },
      },
    };
    const [parsed] = await nexonCommunityAdapter.parse(fetched, context);
    const [record] = await nexonCommunityAdapter.normalize(parsed, source, context);
    expect(record.content_type).toBe('creator-announcement');
    expect(record.title).toBe('Create a World Trustworthy to Players & Creators');
    expect(record.metadata.parser_warnings).toEqual([]);
  });

  it('keeps an N event-error follow-up as a notice instead of an event', async () => {
    const detail = await fixture('nexon-n-event-issue-detail.json');
    const source = {
      ...baseSource,
      id: 'n-official-documentation-announcements',
      series: 'n',
      content_types: ['event', 'maintenance', 'news', 'patch-note'],
      adapter_config: { mode: 'n' },
    };
    const context = { now: '2026-07-20T12:00:00Z', source };
    const fetched = {
      ...result(detail),
      discoveredItem: {
        url: 'https://msu.io/maplestoryn/news/notices/3445873', externalId: '3445873',
        title: 'Notice Regarding Abuse of the Anniversary Universe Villains Event Error',
        publishedAt: '2026-05-15T10:15:00Z', metadata: { content_type: 'news', headline_id: '5132' },
      },
    };
    const [parsed] = await nexonCommunityAdapter.parse(fetched, context);
    const [record] = await nexonCommunityAdapter.normalize(parsed, source, context);
    expect(record.content_type).toBe('news');
    expect(record.subcategory).toBe('notice');
    expect(record.event_start).toBeUndefined();
  });

  it('keeps all four MapleStory N boards independently configured without adapter hard-coding', async () => {
    const [events, updates, guides, notices, adapterCode] = await Promise.all([
      sourceFixture('n-official-events.json'),
      sourceFixture('n-official-updates.json'),
      sourceFixture('n-official-guides.json'),
      sourceFixture('n-official-documentation-announcements.json'),
      readFile(path.join(repositoryRoot, 'adapters', 'nexon-community', 'index.mjs'), 'utf8'),
    ]);
    expect([notices, events, updates, guides].map((source) => source.adapter_config.board_id))
      .toEqual(['5288', '5289', '5290', '5291']);
    expect(new Set([notices, events, updates, guides].map((source) => source.id)).size).toBe(4);
    expect(events.adapter_config.canonical_template).toContain('/news/events/{threadId}');
    expect(updates.adapter_config.canonical_template).toContain('/news/update/{threadId}');
    expect(guides.adapter_config.canonical_template).toContain("/news/Beginner's%20Guide/{threadId}");
    expect(adapterCode).not.toMatch(/5289|5290|5291|n-official-events|n-official-updates|n-official-guides/);
  });

  it('classifies N Events conservatively, separates event dates, and keeps occurrence identities stable', async () => {
    const [firstBody, secondBody, details, configured] = await Promise.all([
      fixture('nexon-community-n-events-page-1.json'),
      fixture('nexon-community-n-events-page-2.json'),
      fixture('nexon-community-n-events-details.json').then(JSON.parse),
      sourceFixture('n-official-events.json'),
    ]);
    const source = {
      ...configured,
      api_url: 'https://public.api.example.com/community-ext-api/api/v1',
      adapter_config: {
        ...configured.adapter_config,
        pagination: { ...configured.adapter_config.pagination, page_size: 8 },
      },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(result(firstBody))
      .mockResolvedValueOnce(result(secondBody));
    const context = { source, now: '2026-07-20T00:00:00Z', fetch: fetchMock };
    const first = (await nexonCommunityAdapter.discoverPages(source)).firstPage;
    const firstResult = await nexonCommunityAdapter.fetchPage(first, source, context);
    const firstItems = await nexonCommunityAdapter.discoverItems(firstResult, first, source, context);
    const next = await nexonCommunityAdapter.discoverNextPage(first, firstResult, firstItems, source, context);
    const secondResult = await nexonCommunityAdapter.fetchPage(next.page, source, context);
    const secondItems = await nexonCommunityAdapter.discoverItems(secondResult, next.page, source, context);

    expect(firstItems.map((item) => item.metadata.content_type)).toEqual([
      'event', 'event', 'news', 'news', 'news', 'news', 'event', 'event',
    ]);
    expect(firstItems[2].metadata.headline_id).toBe('3297');
    expect(firstItems[2].metadata.content_type).toBe('news');
    expect(firstItems.at(-1).externalId).toBe(secondItems[0].externalId);
    expect(new Set(secondItems.slice(1, 3).map((item) => item.externalId)).size).toBe(2);
    expect(await nexonCommunityAdapter.discoverNextPage(next.page, secondResult, secondItems, source, context))
      .toMatchObject({ page: null, reason: 'last-page' });
    expect(decodeURIComponent(fetchMock.mock.calls[1][0])).toContain('blockStartKey=253402300799,9223372036854775807');

    const parseDetail = async (externalId) => {
      const item = firstItems.find((entry) => entry.externalId === externalId);
      return nexonCommunityAdapter.parse(
        { ...result(JSON.stringify(details[externalId])), discoveredItem: item }, context,
      );
    };
    const [dated] = await parseDetail('9101');
    const [datedRecord] = await nexonCommunityAdapter.normalize(dated, source, context);
    expect(datedRecord).toMatchObject({
      event_start: '2026-07-01', event_end: null, timezone: 'UTC',
    });
    expect(datedRecord.metadata.event_date_evidence).toBe('official-listing-tags');
    expect(datedRecord.metadata.event_open_ended).toBe(true);
    expect(datedRecord.metadata.official_tags).toContain('9999-01-01T23:59:59Z');
    expect(JSON.stringify(datedRecord)).not.toContain('9999-01-01T23:59:59.000Z');

    const occurrences = await parseDetail('9102');
    expect(occurrences).toHaveLength(2);
    const occurrenceRecords = (await Promise.all(
      occurrences.map((entry) => nexonCommunityAdapter.normalize(entry, source, context)),
    )).flat();
    expect(occurrenceRecords.map((entry) => entry.external_id)).toEqual(['9102:stage-one', '9102:stage-two']);
    const renamedOccurrence = await nexonCommunityAdapter.normalize(
      { ...occurrences[0], title: 'Renamed Stage' }, source, context,
    );
    expect(renamedOccurrence[0].id).toBe(occurrenceRecords[0].id);

    const [resultParsed] = await parseDetail('9103');
    const [resultRecord] = await nexonCommunityAdapter.normalize(resultParsed, source, context);
    expect(resultRecord.content_type).toBe('news');
    expect(resultRecord.subcategory).toBe('event-result');
    expect(resultRecord.event_start).toBeUndefined();

    const [unknownDates] = await parseDetail('9107');
    const [unknownRecord] = await nexonCommunityAdapter.normalize(unknownDates, source, context);
    expect(unknownRecord.event_start).toBeNull();
    expect(unknownRecord.metadata.parser_warnings).toContain('event-dates-not-confirmed');

    const [claimParsed] = await parseDetail('9108');
    const [claimRecord] = await nexonCommunityAdapter.normalize(claimParsed, source, context);
    expect(claimRecord).toMatchObject({
      event_start: '2026-06-20', event_end: '2026-06-27T23:59:59.000Z',
      claim_start: '2026-06-28T00:00:00.000Z', claim_end: '2026-07-05T23:59:59.000Z',
    });
  });

  it('distinguishes N patch, developer, maintenance, known-issue, economy, and marketplace updates', async () => {
    const [firstBody, secondBody, details, configured] = await Promise.all([
      fixture('nexon-community-n-updates-page-1.json'),
      fixture('nexon-community-n-updates-page-2.json'),
      fixture('nexon-community-n-updates-details.json').then(JSON.parse),
      sourceFixture('n-official-updates.json'),
    ]);
    const source = {
      ...configured,
      api_url: 'https://public.api.example.com/community-ext-api/api/v1',
      adapter_config: {
        ...configured.adapter_config,
        pagination: { ...configured.adapter_config.pagination, page_size: 8 },
      },
    };
    const fetchMock = vi.fn().mockResolvedValueOnce(result(firstBody)).mockResolvedValueOnce(result(secondBody));
    const context = { source, now: '2026-07-20T00:00:00Z', fetch: fetchMock };
    const first = (await nexonCommunityAdapter.discoverPages(source)).firstPage;
    const firstResult = await nexonCommunityAdapter.fetchPage(first, source, context);
    const firstItems = await nexonCommunityAdapter.discoverItems(firstResult, first, source, context);
    const next = await nexonCommunityAdapter.discoverNextPage(first, firstResult, firstItems, source, context);
    const secondResult = await nexonCommunityAdapter.fetchPage(next.page, source, context);
    const secondItems = await nexonCommunityAdapter.discoverItems(secondResult, next.page, source, context);

    expect(firstItems.map((item) => item.metadata.content_type)).toEqual([
      'patch-note', 'developer-note', 'news', 'maintenance', 'news', 'news', 'news', 'patch-note',
    ]);
    expect(firstItems[0].metadata.content_type).toBe('patch-note');
    expect(firstItems[0].title).toContain('Patch Note');
    expect(firstItems[2].metadata.content_type).toBe('news');
    expect(firstItems[5].metadata.content_type).toBe('news');
    expect(firstItems[6].metadata.content_type).toBe('news');
    expect(secondItems.at(-1).metadata.content_type).toBe('developer-note');

    const patchItem = firstItems[0];
    const [parsedPatch] = await nexonCommunityAdapter.parse(
      { ...result(JSON.stringify(details['9201'])), discoveredItem: patchItem }, context,
    );
    const [patchRecord] = await nexonCommunityAdapter.normalize(parsedPatch, source, context);
    expect(patchRecord.content_type).toBe('patch-note');
    expect(patchRecord.subcategory).toBe('patch-notes');

    const originalItem = firstItems.at(-1);
    const originalParsed = {
      canonicalUrl: originalItem.url, sourceUrl: originalItem.url, externalId: originalItem.externalId,
      title: originalItem.title, originalTitle: originalItem.title, publishedAt: originalItem.publishedAt,
      contentType: 'patch-note', subcategory: 'patch-notes', metadata: {},
    };
    const [original] = await nexonCommunityAdapter.normalize(originalParsed, source, context);
    const [renamed] = await nexonCommunityAdapter.normalize(
      { ...originalParsed, title: 'Completely Renamed Patch' }, source, context,
    );
    expect(renamed.id).toBe(original.id);
  });

  it('keeps N Guides as guides unless page semantics clearly identify another type', async () => {
    const [firstBody, secondBody, details, configured] = await Promise.all([
      fixture('nexon-community-n-guides-page-1.json'),
      fixture('nexon-community-n-guides-page-2.json'),
      fixture('nexon-community-n-guides-details.json').then(JSON.parse),
      sourceFixture('n-official-guides.json'),
    ]);
    const source = {
      ...configured,
      api_url: 'https://public.api.example.com/community-ext-api/api/v1',
      adapter_config: {
        ...configured.adapter_config,
        pagination: { ...configured.adapter_config.pagination, page_size: 8 },
      },
    };
    const fetchMock = vi.fn().mockResolvedValueOnce(result(firstBody)).mockResolvedValueOnce(result(secondBody));
    const context = { source, now: '2026-07-20T00:00:00Z', fetch: fetchMock };
    const first = (await nexonCommunityAdapter.discoverPages(source)).firstPage;
    const firstResult = await nexonCommunityAdapter.fetchPage(first, source, context);
    const firstItems = await nexonCommunityAdapter.discoverItems(firstResult, first, source, context);
    const next = await nexonCommunityAdapter.discoverNextPage(first, firstResult, firstItems, source, context);
    const secondResult = await nexonCommunityAdapter.fetchPage(next.page, source, context);
    const secondItems = await nexonCommunityAdapter.discoverItems(secondResult, next.page, source, context);
    const end = await nexonCommunityAdapter.discoverNextPage(next.page, secondResult, secondItems, source, context);

    expect(firstItems.map((item) => item.metadata.content_type)).toEqual([
      'guide', 'guide', 'guide', 'guide', 'guide', 'guide', 'maintenance', 'guide',
    ]);
    expect(firstItems[0].url).toBe("https://msu.io/maplestoryn/news/Beginner's%20Guide/9301");
    expect(secondItems).toHaveLength(1);
    expect(end).toMatchObject({ page: null, reason: 'last-page', totalPages: 2 });

    const [guideParsed] = await nexonCommunityAdapter.parse(
      { ...result(JSON.stringify(details['9301'])), discoveredItem: firstItems[0] }, context,
    );
    const [guideRecord] = await nexonCommunityAdapter.normalize(guideParsed, source, context);
    expect(guideRecord.content_type).toBe('guide');
    expect(guideRecord.subcategory).toBe('gameplay-guide');
    expect(guideRecord.updated_at).not.toBeNull();

    const noUpdateItem = firstItems.find((item) => item.externalId === '9308');
    const [noUpdateParsed] = await nexonCommunityAdapter.parse(
      { ...result(JSON.stringify(details['9308'])), discoveredItem: noUpdateItem }, context,
    );
    const [noUpdateRecord] = await nexonCommunityAdapter.normalize(noUpdateParsed, source, context);
    expect(noUpdateRecord.updated_at).toBeNull();
    expect(noUpdateRecord.metadata.unconfirmed_fields).toContain('updated_at');
  });
});
