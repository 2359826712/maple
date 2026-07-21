import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createGeneratedIndexes,
  findDuplicateResources,
  generatedDirectory,
  normalizeCanonicalUrl,
  readResourceRecords,
  repositoryRoot,
  supportedSeries,
} from './lib/resource-index.mjs';
import { validateResourceSet } from './lib/resource-validation.mjs';
import { createContentIndexes } from './content/build.mjs';
import { readContentRecords, readSourceRecords } from './content/data.mjs';
import {
  getFreshBrowserVerification,
  readBrowserVerifications,
} from './lib/browser-verification.mjs';
import {
  getFreshAccessVerification,
  readAccessVerifications,
} from './lib/access-verification.mjs';

describe('resource index', () => {
  it('normalizes canonical URLs without removing meaningful parameters', () => {
    expect(normalizeCanonicalUrl('http://EXAMPLE.com:80/tools/?utm_source=test&locale=ko&b=2#a'))
      .toBe('https://example.com/tools?b=2&locale=ko');
    expect(normalizeCanonicalUrl('https://EXAMPLE.com:443/tools/?UTM_Source=test&locale=ko'))
      .toBe('https://example.com/tools?locale=ko');
    expect(normalizeCanonicalUrl('https://example.com/?gclid=123')).toBe('https://example.com/');
    expect(normalizeCanonicalUrl('https://example.com/app#calculator', { preserveFragment: true }))
      .toBe('https://example.com/app#calculator');
  });

  it('detects duplicate IDs and normalized URLs', () => {
    const records = [
      { relativePath: 'resources/maplestory/news/one.json', data: { id: 'one', url: 'https://Example.com/news/?utm_source=test' } },
      { relativePath: 'resources/m/news/two.json', data: { id: 'one', url: 'https://example.com/news' } },
    ];
    const duplicates = findDuplicateResources(records);
    expect(duplicates.ids).toHaveLength(1);
    expect(duplicates.urls).toHaveLength(1);
  });

  it.each([
    ['invalid enum values', (data) => { data.status = 'working'; }, '/status must be equal to one of the allowed values'],
    ['invalid dates', (data) => { data.last_checked = '2026-02-30'; }, '/last_checked must match format "date"'],
    ['missing required fields', (data) => { delete data.name; }, '/ must have required property \'name\''],
    ['invalid URLs', (data) => { data.url = 'not-a-url'; data.source_urls[0] = data.url; }, '/url must match pattern "^https://"'],
  ])('rejects %s', async (_name, mutate, expectedError) => {
    const [source] = await readResourceRecords();
    const record = { ...source, data: structuredClone(source.data) };
    mutate(record.data);

    expect(await validateResourceSet([record])).toEqual(expect.arrayContaining([
      expect.stringContaining(expectedError),
    ]));
  });

  it('rejects filename, series-directory, and category-directory mismatches', async () => {
    const [source] = await readResourceRecords();
    const wrongSeries = supportedSeries.find((series) => series !== source.data.series);
    const wrongCategory = source.data.category === 'other' ? 'news' : 'other';
    const relativePath = `resources/${wrongSeries}/${wrongCategory}/wrong-id.json`;
    const record = {
      ...source,
      filePath: path.join(repositoryRoot, ...relativePath.split('/')),
      relativePath,
    };

    expect(await validateResourceSet([record])).toEqual(expect.arrayContaining([
      expect.stringContaining('filename must match id'),
      expect.stringContaining('directory series must match'),
      expect.stringContaining('directory category must match'),
    ]));
  });

  it('validates the initial resource set and covers every supported series', async () => {
    const records = await readResourceRecords();
    expect(await validateResourceSet(records)).toEqual([]);
    expect([...new Set(records.map((record) => record.data.series))].sort()).toEqual(supportedSeries);
  });

  it('keeps a verified official batch for every supported series', async () => {
    const records = await readResourceRecords();
    const counts = Object.fromEntries(supportedSeries.map((series) => [
      series,
      records.filter((record) => record.data.series === series && record.data.official).length,
    ]));

    expect(Math.min(...Object.values(counts))).toBeGreaterThanOrEqual(2);
    expect(records).toHaveLength(31);
    expect(records.every((record) => record.data.official)).toBe(true);
  });

  it('keeps generated output reproducible from source resources', async () => {
    const expected = createGeneratedIndexes(await readResourceRecords());
    const contentRecords = await readContentRecords();
    const sourceRecords = await readSourceRecords();
    const contentIndexes = createContentIndexes(contentRecords, sourceRecords);
    expected.content = contentIndexes.content;
    expected.sources = contentIndexes.sources;
    expected['content-statistics'] = contentIndexes['content-statistics'];
    const { createContentManifest } = await import('./content/manifest.mjs');
    expected['content-manifest'] = createContentManifest(contentRecords, sourceRecords);
    const { createContentRelease } = await import('./content/release.mjs');
    expected['content-release'] = createContentRelease(expected['content-manifest']);
    expected.search = [...expected.search, ...contentIndexes.search].sort((left, right) => left.id.localeCompare(right.id));
    for (const [name, value] of Object.entries(expected)) {
      const generated = JSON.parse(await readFile(path.join(generatedDirectory, `${name}.json`), 'utf8'));
      expect(generated).toEqual(value);
    }
  });

  it('accepts fresh browser evidence for anti-bot URLs and expires old checks', async () => {
    const checks = await readBrowserVerifications();
    const url = 'https://forum.nexon.com/maplestoryidle/board_view?board=6675&thread=3474001';

    expect(getFreshBrowserVerification(checks, url, { now: new Date('2026-07-20T00:00:00Z') }))
      .toMatchObject({ result: 'verified', page_title: '(Updated) June 11 Patch Notes' });
    expect(getFreshBrowserVerification(checks, url, { now: new Date('2026-09-01T00:00:00Z') }))
      .toBeUndefined();
  });

  it('keeps indexed anti-bot evidence distinct from browser verification', async () => {
    const checks = await readAccessVerifications();
    const verification = getFreshAccessVerification(
      checks,
      'https://support-maplestory.nexon.com/hc/en-us/categories/200377735-Gameplay',
      { now: new Date('2026-07-20T00:00:00Z') },
    );

    expect(verification).toMatchObject({
      method: 'official-search-index',
      page_title: 'Gameplay - MapleStory',
    });
  });
});
