import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { browserAdapter, resetBrowserConnection } from '../adapters/browser/index.mjs';
import { htmlAdapter } from '../adapters/html/index.mjs';
import { jsonApiAdapter } from '../adapters/json-api/index.mjs';
import { rssAdapter } from '../adapters/rss/index.mjs';
import { sitemapAdapter } from '../adapters/sitemap/index.mjs';
import { calculateEventStatus } from './content/events.mjs';
import { findContentDuplicates } from './content/duplicates.mjs';
import { createContentHash, generateStableContentId, normalizeContentUrl } from './content/identity.mjs';
import { createRevisionSnapshot } from './content/snapshots.mjs';
import { readSourceRecords } from './content/data.mjs';
import { validateContentSet, validateSourceSet } from './content/validation.mjs';
import { repositoryRoot } from './lib/resource-index.mjs';

vi.mock('../adapters/browser/cdp.mjs', () => ({
  connectBrowser: vi.fn(),
  navigateAndWait: vi.fn(),
  extractPageHtml: vi.fn(),
  getCurrentUrl: vi.fn(),
  evaluate: vi.fn(),
  closeBrowserConnection: vi.fn(),
  closeAllSessions: vi.fn(),
}));

const fixtureDirectory = path.join(repositoryRoot, 'tests', 'fixtures', 'content');
const fixture = (name) => readFile(path.join(fixtureDirectory, name), 'utf8');

function source(overrides = {}) {
  return {
    id: 'maplestory-fixture-news',
    name: 'Fixture News',
    series: 'maplestory',
    regions: ['global'],
    languages: ['en'],
    source_type: 'official-site',
    content_types: ['news', 'patch-note'],
    base_url: 'https://example.com/',
    discovery_urls: ['https://example.com/news'],
    feed_url: null,
    api_url: null,
    sitemap_urls: [],
    adapter: 'html',
    parser: 'fixture-news',
    adapter_config: { default_content_type: 'news', include_patterns: ['/news/'] },
    official: true,
    enabled: true,
    crawl_frequency: '3h',
    rate_limit: { requests: 1, per_seconds: 3 },
    requires_javascript: false,
    requires_login: false,
    storage_mode: 'summary-and-metadata',
    robots_policy: 'respect',
    last_checked: null,
    last_success: null,
    last_error: null,
    notes: null,
    ...overrides,
  };
}

function fetchResult(body, url, contentType) {
  return {
    requestUrl: url,
    finalUrl: url,
    status: 200,
    contentType,
    etag: null,
    lastModified: null,
    fetchedAt: '2026-07-18T12:00:00Z',
    body,
  };
}

describe('content index infrastructure', () => {
  it('generates stable IDs from permanent source IDs and normalizes URLs', () => {
    const input = { series: 'maplestory', region: 'global', sourceId: 'maplestory-fixture-news', publishedAt: '2026-07-18', externalId: '42', title: 'Original title' };
    const id = generateStableContentId(input);
    expect(generateStableContentId({ ...input, title: 'Changed title' })).toBe(id);
    expect(normalizeContentUrl('http://EXAMPLE.com:80/news/42/?utm_source=test#top')).toBe('https://example.com/news/42');
  });

  it('creates deterministic semantic hashes and revision snapshots', async () => {
    const previous = { id: 'one', title: 'Before', content_hash: 'a'.repeat(64), last_checked: '2026-07-18T10:00:00Z' };
    const next = { ...previous, title: 'After', last_checked: '2026-07-18T11:00:00Z' };
    next.content_hash = createContentHash(next);
    expect(createContentHash({ b: 2, a: 1 })).toBe(createContentHash({ a: 1, b: 2 }));
    expect(createContentHash({ title: 'Same', last_checked: '2026-01-01T00:00:00Z' }))
      .toBe(createContentHash({ title: 'Same', last_checked: '2026-02-01T00:00:00Z' }));
    const revision = await createRevisionSnapshot(previous, next, { write: false, detectedAt: '2026-07-18T11:00:00Z' });
    expect(revision.snapshot.changed_fields).toEqual(['content_hash', 'last_checked', 'title']);
  });

  it('calculates event calendar states without inventing missing dates', () => {
    const now = new Date('2026-07-18T12:00:00Z');
    expect(calculateEventStatus({ event_start: null, event_end: null }, { now })).toBe('unknown');
    expect(calculateEventStatus({ event_start: '2026-07-20T00:00:00Z', event_end: '2026-07-30T00:00:00Z' }, { now })).toBe('upcoming');
    expect(calculateEventStatus({ event_start: '2026-07-01T00:00:00Z', event_end: '2026-07-19T12:00:00Z' }, { now })).toBe('ending-soon');
    expect(calculateEventStatus({ event_start: '2026-07-01T00:00:00Z', event_end: '2026-07-10T00:00:00Z' }, { now })).toBe('ended');
  });

  it('discovers RSS, sitemap, HTML, and JSON API items through reusable adapters', async () => {
    const [feed, sitemap, listing, api] = await Promise.all(['feed.xml', 'sitemap.xml', 'listing.html', 'api.json'].map(fixture));
    const context = {
      now: '2026-07-18T12:00:00Z',
      dryRun: true,
      fetch: async (url) => {
        if (url.endsWith('.xml') && url.includes('feed')) return fetchResult(feed, url, 'application/rss+xml');
        if (url.endsWith('.xml')) return fetchResult(sitemap, url, 'application/xml');
        if (url.endsWith('.json')) return fetchResult(api, url, 'application/json');
        return fetchResult(listing, url, 'text/html');
      },
    };
    expect(await rssAdapter.discover(source({ adapter: 'rss', feed_url: 'https://example.com/feed.xml' }), context))
      .toEqual([expect.objectContaining({ externalId: 'news-42', url: 'https://example.com/news/42' })]);
    expect(await sitemapAdapter.discover(source({ adapter: 'sitemap', sitemap_urls: ['https://example.com/sitemap.xml'] }), context))
      .toEqual([expect.objectContaining({ publishedAt: '2026-07-18', url: 'https://example.com/news/42' })]);
    expect(await htmlAdapter.discover(source({ adapter_config: { link_selector: 'a.article', title_selector: 'span', include_patterns: ['/news/'] } }), context))
      .toEqual([expect.objectContaining({ title: 'Fixture Patch Notes', url: 'https://example.com/news/42' })]);
    expect(await jsonApiAdapter.discover(source({ adapter: 'json-api', api_url: 'https://example.com/news.json', adapter_config: { items_path: 'items' } }), context))
      .toEqual([expect.objectContaining({ externalId: '42', url: 'https://example.com/news/42' })]);
  });

  it('normalizes fetched HTML to summary-and-metadata without copying the body', async () => {
    const body = await fixture('article.html');
    const parsed = await htmlAdapter.parse(fetchResult(body, 'https://example.com/news/42', 'text/html'));
    const records = await htmlAdapter.normalize(parsed[0], source(), { now: '2026-07-18T12:00:00Z', dryRun: true });
    expect(records[0]).toMatchObject({
      canonical_url: 'https://example.com/news/42',
      summary: 'Summarizes the fixture update without reproducing its full text.',
      body_text: null,
      body_markdown: null,
      storage_mode: 'summary-and-metadata',
    });
  });

  it('validates all six official source configurations', async () => {
    const sources = await readSourceRecords();
    expect(await validateSourceSet(sources)).toEqual([]);
    expect(new Set(sources.map((record) => record.data.series)).size).toBe(6);
  });

  it('validates a structured event fixture and detects duplicate signals', async () => {
    const sourceRecords = await readSourceRecords();
    const data = {
      id: 'maplestory-global-fixture-2026-07-18-event-42', source_id: 'maplestory-gms-official-news',
      canonical_url: 'https://example.com/events/42', source_url: 'https://example.com/events/42', external_id: '42',
      title: 'Fixture Event', original_title: 'Fixture Event', series: 'maplestory', regions: ['global'], languages: ['en'],
      content_type: 'event', subcategory: null, official: true, author: null, published_at: '2026-07-18', updated_at: null,
      discovered_at: '2026-07-18T12:00:00Z', last_checked: '2026-07-18T12:00:00Z', summary: 'A structured fixture event.',
      body_text: null, body_markdown: null, storage_mode: 'summary-and-metadata', tags: [], images: [], attachments: [],
      related_content_ids: [], related_urls: [], content_hash: 'a'.repeat(64), status: 'published', translation_status: 'not-requested',
      metadata: {}, notes: null, event_name: 'Fixture Event', registration_start: null, registration_end: null,
      event_start: '2026-07-18T00:00:00+09:00', event_end: '2026-08-20T23:59:59+09:00', claim_start: null, claim_end: null,
      shop_start: null, shop_end: null, timezone: 'Asia/Tokyo', eligibility: [], requirements: [], rewards: [], event_currency: [],
      event_shop: null, participation_steps: [], related_announcement_id: null, related_patch_ids: [], calendar_status: 'active',
    };
    const relativePath = `content/events/maplestory/2026/${data.id}.json`;
    const record = { data, relativePath, filePath: path.join(repositoryRoot, ...relativePath.split('/')) };
    expect(await validateContentSet([record], { sourceRecords })).toEqual([]);
    const duplicates = findContentDuplicates([record, { ...record, relativePath: `${relativePath}.duplicate` }]);
    expect(duplicates.ids).toHaveLength(1);
    expect(duplicates.urls).toHaveLength(1);
    expect(duplicates.externalIds).toHaveLength(1);
  });
});

describe('browser adapter', () => {
  const mockSession = { send: vi.fn(), on: vi.fn(), close: vi.fn(), _page: true };
  const cdpMocks = {
    connectBrowser: vi.fn().mockResolvedValue({ session: mockSession, target: { url: 'about:blank' } }),
    navigateAndWait: vi.fn().mockResolvedValue(undefined),
    extractPageHtml: vi.fn(),
    getCurrentUrl: vi.fn(),
  };

  // Re-bind the hoisted mock implementations before each test.
  beforeEach(async () => {
    resetBrowserConnection();
    const cdp = await import('../adapters/browser/cdp.mjs');
    Object.assign(cdp, cdpMocks);
    Object.values(cdpMocks).forEach((mock) => mock.mockClear());
    // Restore default implementations after mockClear.
    cdpMocks.connectBrowser.mockResolvedValue({ session: mockSession, target: { url: 'about:blank' } });
    cdpMocks.navigateAndWait.mockResolvedValue(undefined);
  });

  const listingHtml = `
    <html><head><title>Board</title></head><body>
    <a href="/MapleStoryMGlobal/board_view?no=100">Summer Event</a>
    <a href="/MapleStoryMGlobal/board_view?no=101">Patch Notes v2.1</a>
    <a href="/other/page">Ignore this</a>
    </body></html>`;

  const articleHtml = `
    <html><head>
    <meta property="og:title" content="Summer Event 2026">
    <meta name="description" content="Details about the summer event.">
    <meta property="article:published_time" content="2026-07-18T10:00:00Z">
    <link rel="canonical" href="https://forum.nexon.com/MapleStoryMGlobal/board_view?no=100">
    </head><body><h1>Summer Event 2026</h1></body></html>`;

  function browserSource(overrides = {}) {
    return source({
      adapter: 'browser',
      adapter_config: {
        default_content_type: 'news',
        include_patterns: ['/board_view'],
      },
      ...overrides,
    });
  }

  it('discovers links from CDP-rendered HTML using include_patterns', async () => {
    const src = browserSource();
    cdpMocks.extractPageHtml.mockResolvedValueOnce(listingHtml);
    cdpMocks.getCurrentUrl.mockResolvedValueOnce(src.discovery_urls[0]);

    const items = await browserAdapter.discover(src, { source: src });
    expect(items).toHaveLength(2);
    expect(items[0].url).toContain('/board_view?no=100');
    expect(items[1].url).toContain('/board_view?no=101');
    expect(cdpMocks.navigateAndWait).toHaveBeenCalledWith(mockSession, src.discovery_urls[0], { renderDelayMs: undefined });
  });

  it('fetches a single item by navigating and extracting rendered HTML', async () => {
    const src = browserSource();
    const item = { url: 'https://forum.nexon.com/MapleStoryMGlobal/board_view?no=100', externalId: null, title: 'Summer Event', publishedAt: null, metadata: {} };
    cdpMocks.extractPageHtml.mockResolvedValueOnce(articleHtml);
    cdpMocks.getCurrentUrl.mockResolvedValueOnce(item.url);

    const result = await browserAdapter.fetch(item, { source: src });
    expect(result.status).toBe(200);
    expect(result.body).toBe(articleHtml);
    expect(result.finalUrl).toBe(item.url);
  });

  it('delegates parse and normalize to the shared pipeline', async () => {
    const src = browserSource();
    const fetchResult = {
      requestUrl: 'https://forum.nexon.com/MapleStoryMGlobal/board_view?no=100',
      finalUrl: 'https://forum.nexon.com/MapleStoryMGlobal/board_view?no=100',
      status: 200, contentType: 'text/html; charset=utf-8',
      etag: null, lastModified: null,
      fetchedAt: '2026-07-18T12:00:00Z',
      body: articleHtml,
      discoveredItem: { externalId: null, title: 'Summer Event 2026', publishedAt: null, metadata: {} },
    };
    const parsed = await browserAdapter.parse(fetchResult);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Summer Event 2026');

    const records = await browserAdapter.normalize(parsed[0], src, { now: '2026-07-18T12:00:00Z', dryRun: true });
    expect(records).toHaveLength(1);
    expect(records[0].canonical_url).toBe('https://forum.nexon.com/MapleStoryMGlobal/board_view?no=100');
    expect(records[0].storage_mode).toBe('summary-and-metadata');
  });

  it('reuses the same CDP session across discover and fetch calls', async () => {
    const src = browserSource();
    // First: discover
    cdpMocks.extractPageHtml.mockResolvedValueOnce(listingHtml);
    cdpMocks.getCurrentUrl.mockResolvedValueOnce(src.discovery_urls[0]);
    await browserAdapter.discover(src, { source: src });

    // Second: fetch
    cdpMocks.extractPageHtml.mockResolvedValueOnce(articleHtml);
    cdpMocks.getCurrentUrl.mockResolvedValueOnce('https://forum.nexon.com/MapleStoryMGlobal/board_view?no=100');
    await browserAdapter.fetch(
      { url: 'https://forum.nexon.com/MapleStoryMGlobal/board_view?no=100', externalId: null, title: 'Summer Event', publishedAt: null, metadata: {} },
      { source: src },
    );

    // connectBrowser should be called only once (session reused)
    expect(cdpMocks.connectBrowser).toHaveBeenCalledTimes(1);
  });

  it('respects adapter_config render_delay_ms in navigation', async () => {
    const src = browserSource({ adapter_config: { default_content_type: 'news', include_patterns: ['/board_view'], render_delay_ms: 5000 } });
    cdpMocks.extractPageHtml.mockResolvedValueOnce(listingHtml);
    cdpMocks.getCurrentUrl.mockResolvedValueOnce(src.discovery_urls[0]);

    await browserAdapter.discover(src, { source: src });
    expect(cdpMocks.navigateAndWait).toHaveBeenCalledWith(mockSession, src.discovery_urls[0], { renderDelayMs: 5000 });
  });
});
