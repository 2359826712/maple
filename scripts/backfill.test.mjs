import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { htmlAdapter } from '../adapters/html/index.mjs';
import { jsonApiAdapter } from '../adapters/json-api/index.mjs';
import { rssAdapter } from '../adapters/rss/index.mjs';
import { sitemapAdapter } from '../adapters/sitemap/index.mjs';
import {
  backfillOptions, contentSimilarity, duplicateForCandidate, persistCandidateUpdate, runBackfill,
} from './backfill.mjs';
import { createProgressLogger, formatBackfillProgress, runBackfillEngine } from './content/backfill-engine.mjs';
import { createHistoricalState, readHistoricalState, writeHistoricalState } from './content/backfill-state.mjs';
import { repositoryRoot } from './lib/resource-index.mjs';
import { contentRecordPath, writeJson } from './content/data.mjs';

const fixtureDirectory = path.join(repositoryRoot, 'tests', 'fixtures', 'content');
const fixture = (name) => readFile(path.join(fixtureDirectory, name), 'utf8');
const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

const source = (overrides = {}) => ({
  id: 'fixture-history', adapter: 'html', enabled: true, requires_login: false,
  discovery_urls: ['https://example.com/news'], sitemap_urls: [], feed_url: null, api_url: null,
  adapter_config: {}, rate_limit: { requests: 1000, per_seconds: 1 }, ...overrides,
});

const result = (body, url, contentType = 'text/html', status = 200) => ({
  body, requestUrl: url, finalUrl: url, contentType, status, etag: null, lastModified: null,
  fetchedAt: '2026-07-20T00:00:00Z',
});

function fakeAdapter(pages) {
  return {
    async discoverPages() { return { supported: true, firstPage: { index: 1, url: 'https://example.com/page/1' }, totalPages: pages.length }; },
    async fetchPage(page) { return result('', page.url, 'application/json', pages[page.index - 1]?.status || 200); },
    async discoverItems(pageResult, page) { return pages[page.index - 1]?.items || []; },
    async discoverNextPage(page) {
      return page.index < pages.length
        ? { page: { index: page.index + 1, url: `https://example.com/page/${page.index + 1}` }, totalPages: pages.length }
        : { page: null, reason: 'last-page', totalPages: pages.length };
    },
  };
}

describe('historical backfill state and engine', () => {
  it('writes and reads an atomic page checkpoint', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'maple-backfill-state-'));
    temporaryDirectories.push(root);
    const state = { ...createHistoricalState('fixture-history', '2026-07-20T00:00:00Z'), current_page: 2, pages_completed: 2 };
    await writeHistoricalState(state, root);
    expect(await readHistoricalState('fixture-history', root)).toMatchObject({ current_page: 2, pages_completed: 2 });
  });

  it('traverses pages, checkpoints each page, and reports complete metrics', async () => {
    const checkpoints = [];
    const processItems = vi.fn(async (items) => ({
      processed: items.length, added: items.length, updated: 0, duplicates: 0,
      skipped: 0, parserErrors: 0, httpErrors: 0,
    }));
    const output = await runBackfillEngine({
      source: source(), adapter: fakeAdapter([{ items: [1, 2] }, { items: [3] }]), context: {},
      initialState: createHistoricalState('fixture-history', '2026-07-20T00:00:00Z'), processItems,
      checkpoint: async (state) => checkpoints.push(structuredClone(state)), now: () => new Date('2026-07-20T00:01:00Z'),
    });
    expect(processItems).toHaveBeenCalledTimes(2);
    expect(output.state).toMatchObject({ pages_completed: 2, items_processed: 3, items_saved: 3, completed: true, stop_reason: 'last-page' });
    expect(checkpoints.some((state) => state.current_page === 1 && state.next_page.index === 2)).toBe(true);
    expect(output.metrics).toMatchObject({ successful_pages: 2, added: 3, failed_pages: 0 });
  });

  it('resumes from next_page and preserves duplicate counters', async () => {
    const fetched = [];
    const adapter = fakeAdapter([{ items: [] }, { items: [] }, { items: ['duplicate'] }]);
    const originalFetch = adapter.fetchPage;
    adapter.fetchPage = async (page, ...args) => { fetched.push(page.index); return originalFetch(page, ...args); };
    const state = {
      ...createHistoricalState('fixture-history', '2026-07-20T00:00:00Z'),
      current_page: 2, pages_completed: 2, duplicates: 50, items_processed: 50,
      next_page: { index: 3, url: 'https://example.com/page/3' },
    };
    const output = await runBackfillEngine({
      source: source(), adapter, context: {}, initialState: state,
      processItems: async () => ({ processed: 1, added: 0, updated: 0, duplicates: 1, skipped: 1, parserErrors: 0, httpErrors: 0 }),
    });
    expect(fetched).toEqual([3]);
    expect(output.state).toMatchObject({ pages_completed: 3, duplicates: 51, items_processed: 51 });
  });

  it('does not restart a completed checkpoint from the first page', async () => {
    const adapter = fakeAdapter([{ items: ['already-saved'] }]);
    const fetchPage = vi.spyOn(adapter, 'fetchPage');
    const processItems = vi.fn();
    const checkpoint = vi.fn();
    const state = {
      ...createHistoricalState('fixture-history', '2026-07-20T00:00:00Z'),
      current_page: 6,
      pages_completed: 6,
      completed: true,
      stop_reason: 'last-page',
      next_page: null,
    };
    const output = await runBackfillEngine({
      source: source(), adapter, context: {}, initialState: state, processItems, checkpoint,
    });
    expect(output.state).toEqual(state);
    expect(fetchPage).not.toHaveBeenCalled();
    expect(processItems).not.toHaveBeenCalled();
    expect(checkpoint).not.toHaveBeenCalled();
  });

  it('stops at max pages, duplicate threshold, and consecutive 404 rules', async () => {
    const counts = (duplicates = 0) => ({ processed: 60, added: 60 - duplicates, updated: 0, duplicates, skipped: duplicates, parserErrors: 0, httpErrors: 0 });
    const max = await runBackfillEngine({
      source: source(), adapter: fakeAdapter([{ items: [1] }, { items: [2] }]), context: {},
      initialState: createHistoricalState('fixture-history'), maxPages: 1, processItems: async () => counts(),
    });
    expect(max.state.stop_reason).toBe('max-pages');

    const duplicate = await runBackfillEngine({
      source: source(), adapter: fakeAdapter([{ items: [1] }, { items: [2] }]), context: {},
      initialState: createHistoricalState('fixture-history'), duplicateThreshold: 100, processItems: async () => counts(60),
    });
    expect(duplicate.state.stop_reason).toBe('duplicate-threshold');

    const notFound = await runBackfillEngine({
      source: source(), adapter: fakeAdapter([{ status: 404 }, { status: 404 }, { items: [3] }]), context: {},
      initialState: createHistoricalState('fixture-history'), consecutive404Limit: 2, processItems: async () => counts(),
    });
    expect(notFound.state.stop_reason).toBe('consecutive-404s');
    expect(notFound.state.pages_failed).toBe(2);
  });

  it('renders known and unknown progress without requiring a TTY', () => {
    const state = { ...createHistoricalState('fixture-history', '2026-07-20T00:00:00Z'), current_page: 2, pages_completed: 2, items_processed: 40, items_saved: 10, items_skipped: 30 };
    expect(formatBackfillProgress({ sourceId: 'fixture-history', state, totalPages: 4, now: Date.parse('2026-07-20T00:02:00Z') }))
      .toContain('██████░░░░░░ Page 2 / 4');
    expect(formatBackfillProgress({ sourceId: 'fixture-history', state })).toContain('Page 2 / Unknown');
    const stream = { isTTY: true, write: vi.fn() };
    createProgressLogger(stream)(formatBackfillProgress({ sourceId: 'fixture-history', state }));
    expect(stream.write).toHaveBeenCalledWith(expect.stringContaining('\rfixture-history'));
  });

  it('reports unsupported adapters without fetching or failing', async () => {
    const output = await runBackfillEngine({
      source: source(), adapter: {}, context: {}, initialState: createHistoricalState('fixture-history'),
      processItems: vi.fn(),
    });
    expect(output).toMatchObject({ supported: false, state: { stop_reason: 'no-pagination-supported', completed: true } });
  });
});

describe('historical pagination adapters', () => {
  it('paginates HTML by next URL and by numeric parameter', async () => {
    const [first, second] = await Promise.all([fixture('pagination-page-1.html'), fixture('pagination-page-2.html')]);
    const nextSource = source({ adapter_config: { link_selector: 'a.article', title_selector: 'span', include_patterns: ['/news/'], pagination: { strategy: 'next-url' } } });
    const pagination = await htmlAdapter.discoverPages(nextSource);
    const items = await htmlAdapter.discoverItems(result(first, pagination.firstPage.url), pagination.firstPage, nextSource);
    expect(items).toHaveLength(2);
    expect((await htmlAdapter.discoverNextPage(pagination.firstPage, result(first, pagination.firstPage.url), items, nextSource)).page.url)
      .toBe('https://example.com/news?page=2');

    const numbered = source({ adapter_config: { link_selector: 'a.article', include_patterns: ['/news/'], pagination: { strategy: 'page', param: 'p', page_size: 2 } } });
    const numberedFirst = (await htmlAdapter.discoverPages(numbered)).firstPage;
    expect(numberedFirst.url).toBe('https://example.com/news?p=1');
    expect((await htmlAdapter.discoverNextPage(numberedFirst, result(second, numberedFirst.url), [1], numbered)).reason).toBe('last-page');
  });

  it('paginates cursor JSON, Atom next links, and sitemap indexes', async () => {
    const [apiBody, feedBody, sitemapBody] = await Promise.all([
      fixture('pagination-api-page-1.json'), fixture('pagination-feed.xml'), fixture('pagination-sitemap-index.xml'),
    ]);
    const apiSource = source({
      adapter: 'json-api', api_url: 'https://example.com/api/news',
      adapter_config: { items_path: 'items', pagination: { strategy: 'cursor', param: 'cursor', next_token_path: 'paging.next_cursor' } },
    });
    const apiFirst = (await jsonApiAdapter.discoverPages(apiSource)).firstPage;
    const apiResult = result(apiBody, apiFirst.url, 'application/json');
    const apiItems = await jsonApiAdapter.discoverItems(apiResult, apiFirst, apiSource);
    expect((await jsonApiAdapter.discoverNextPage(apiFirst, apiResult, apiItems, apiSource)).page.url)
      .toBe('https://example.com/api/news?cursor=cursor-2');

    const feedSource = source({ feed_url: 'https://example.com/feed', adapter_config: { pagination: { strategy: 'next-url' } } });
    const feedFirst = (await rssAdapter.discoverPages(feedSource)).firstPage;
    const feedResult = result(feedBody, feedFirst.url, 'application/atom+xml');
    expect((await rssAdapter.discoverNextPage(feedFirst, feedResult, await rssAdapter.discoverItems(feedResult), feedSource)).page.url)
      .toBe('https://example.com/feed?page=2');

    const sitemapSource = source({ sitemap_urls: ['https://example.com/sitemap-index.xml'] });
    const sitemapFirst = (await sitemapAdapter.discoverPages(sitemapSource)).firstPage;
    const sitemapResult = result(sitemapBody, sitemapFirst.url, 'application/xml');
    const next = await sitemapAdapter.discoverNextPage(sitemapFirst, sitemapResult);
    expect(next).toMatchObject({ totalPages: 3, page: { url: 'https://example.com/sitemap-2026.xml' } });
  });
});

describe('historical backfill CLI orchestration', () => {
  it('relocates a genuinely reclassified record and snapshots the previous revision', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'maple-backfill-relocate-'));
    temporaryDirectories.push(root);
    const contentRoot = path.join(root, 'content');
    const snapshotRoot = path.join(root, 'snapshots');
    const previousData = {
      id: 'fixture-record', series: 'maplestory', content_type: 'cash-shop',
      published_at: '2025-12-16T18:20:00Z', content_hash: 'old-hash',
    };
    const candidate = { ...previousData, content_type: 'maintenance', content_hash: 'new-hash' };
    const previous = { data: previousData, filePath: contentRecordPath(previousData, contentRoot) };
    await writeJson(previous.filePath, previousData);
    const target = await persistCandidateUpdate(previous, candidate, {
      contentRoot, snapshotRoot, detectedAt: '2026-07-20T00:00:00Z',
    });
    await expect(readFile(contentRecordPath(previousData, contentRoot), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
    expect(JSON.parse(await readFile(target, 'utf8'))).toMatchObject({ content_type: 'maintenance' });
    expect(await readdir(path.join(snapshotRoot, previousData.id))).toHaveLength(1);
  });

  it('parses CLI options and performs a dry backfill without checkpoints or index writes', async () => {
    expect(backfillOptions(['--source=fixture-history', '--max-pages=2', '--resume', '--dry-run']))
      .toMatchObject({ sourceId: 'fixture-history', maxPages: 2, resume: true, execute: false, dryRun: true });
    expect(contentSimilarity('same article body', 'same article body')).toBe(1);
    const candidate = { source_id: 'source-a', content_hash: 'same', published_at: '2026-07-20', summary: 'Similar title' };
    const otherSource = { data: { source_id: 'source-b', summary: 'Similar title' } };
    expect(duplicateForCandidate(candidate, {
      byHash: new Map([['same', otherSource]]),
      bySourceDate: new Map(),
    })).toBeNull();
    const writeState = vi.fn();
    const buildIndexes = vi.fn();
    const output = await runBackfill(['--source=fixture-history', '--max-pages=1', '--dry-run'], {
      sourceRecords: [{ data: source() }], existing: {}, getAdapter: () => fakeAdapter([{ items: [1] }]),
      clientFactory: () => ({ metrics: { retries: 0 }, fetch: vi.fn() }),
      processItems: async () => ({ processed: 1, added: 1, updated: 0, duplicates: 0, skipped: 0, parserErrors: 0, httpErrors: 0 }),
      writeState, buildIndexes, log: vi.fn(),
    });
    expect(output[0].state.stop_reason).toBe('last-page');
    expect(writeState).not.toHaveBeenCalled();
    expect(buildIndexes).not.toHaveBeenCalled();
  });
});
