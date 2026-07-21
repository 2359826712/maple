import { describe, expect, it } from 'vitest';
import {
  buildPublisherPlan,
  createProjection,
  projectionAction,
} from './publisher.mjs';
import { createContentManifest, validateContentManifest } from './manifest.mjs';
import { applySeriesContent } from './publisher-database.mjs';

const source = {
  id: 'maplestory-gms-official-news',
  name: 'Global MapleStory News',
  series: 'maplestory',
};

function record(overrides = {}) {
  return {
    id: 'maplestory-global-summer-event',
    source_id: source.id,
    canonical_url: 'https://www.nexon.com/maplestory/news/events/summer-event',
    title: 'Summer Event',
    series: 'maplestory',
    regions: ['europe', 'north-america'],
    languages: ['en'],
    content_type: 'event',
    summary: 'A summer event.',
    body_text: null,
    body_markdown: null,
    published_at: '2026-07-01T00:00:00.000Z',
    updated_at: null,
    discovered_at: '2026-07-02T00:00:00.000Z',
    last_checked: '2026-07-03T00:00:00.000Z',
    status: 'published',
    metadata: { season: 'summer' },
    ...overrides,
  };
}

describe('content publisher projection', () => {
  it('maps stable content identity into the existing series content model', () => {
    const projection = createProjection(record(), source);

    expect(projection).toMatchObject({
      series_id: 'maplestory-pc',
      edition_id: 'maplestory-pc:gms',
      module: 'events',
      slug: 'maplestory-global-summer-event',
      source_language: 'en',
      source_label: source.name,
      status: 'published',
      translations_needed: ['zh', 'zh-Hant', 'ja', 'ko'],
    });
    expect(projection.source_revision).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('changes translation revision for display metadata but not crawl timestamps', () => {
    const baseline = createProjection(record(), source);
    const metadataChange = createProjection(record({ metadata: { season: 'autumn' } }), source);
    const crawlChange = createProjection(record({ last_checked: '2026-07-04T00:00:00.000Z' }), source);

    expect(metadataChange.source_revision).not.toBe(baseline.source_revision);
    expect(crawlChange.source_revision).toBe(baseline.source_revision);
  });

  it('normalizes repository language and SEA edition codes to database values', () => {
    const seaSource = { id: 'maplestory-sea-news', name: 'MapleSEA News', series: 'maplestory' };
    const projection = createProjection(record({
      source_id: seaSource.id,
      regions: ['sea'],
      languages: ['zh-hant'],
    }), seaSource);

    expect(projection.edition_id).toBe('maplestory-pc:msea');
    expect(projection.source_language).toBe('zh-Hant');
    expect(projection.translations_needed).toEqual(['en', 'zh', 'ja', 'ko']);
  });

  it('distinguishes inserts, exact skips, and operational updates', () => {
    const projection = createProjection(record(), source);

    expect(projectionAction(projection, null)).toBe('insert');
    expect(projectionAction(projection, projection)).toBe('skip');
    expect(projectionAction(projection, { ...projection, source_url: 'https://example.com/new' })).toBe('update');
  });

  it('reports unmapped records without losing valid projections', () => {
    const contentRecords = [
      {
        relativePath: 'content/events/maplestory/2026/maplestory-global-summer-event.json',
        data: record(),
      },
      {
        relativePath: 'content/events/maplestory/2026/ambiguous-language.json',
        data: record({ id: 'ambiguous-language', languages: ['en', 'ja'] }),
      },
    ];
    const result = buildPublisherPlan({
      contentRecords,
      sourceRecords: [{ data: source }],
    });

    expect(result.summary).toEqual({ files: 2, valid: 1, insert: 1, update: 0, skip: 0, error: 1 });
    expect(result.errors[0].error).toContain('exactly one supported source language');
  });

  it('creates a deterministic, self-verifying snapshot manifest', () => {
    const contentRecords = [{
      relativePath: 'content/events/maplestory/2026/maplestory-global-summer-event.json',
      fileHash: 'a'.repeat(64),
      data: record(),
    }];
    const sourceRecords = [{
      relativePath: 'sources/maplestory/maplestory-gms-official-news.json',
      fileHash: 'b'.repeat(64),
      data: source,
    }];
    const manifest = createContentManifest(contentRecords, sourceRecords);

    expect(manifest).toMatchObject({ schema_version: 1, file_count: 1, source_count: 1 });
    expect(manifest.root_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(() => validateContentManifest(manifest)).not.toThrow();
    expect(() => validateContentManifest({ ...manifest, file_count: 2 })).toThrow(/counts/);
  });

  it('applies only series_content rows and reconciles before and after commit', async () => {
    const contentRecords = [{
      relativePath: 'content/events/maplestory/2026/maplestory-global-summer-event.json',
      data: record(),
    }];
    const sourceRecords = [{ data: source }];
    const projection = createProjection(record(), source);
    let written = false;
    const statements = [];
    const client = {
      async query(sql) {
        statements.push(sql);
        if (String(sql).includes('insert into public.publisher_runs')) {
          return { rows: [{ id: 'publisher-run-uuid', manifest_hash: 'c'.repeat(64), status: 'running' }] };
        }
        if (String(sql).includes('insert into public.series_content')) {
          written = true;
          return { rows: [{ id: 'content-uuid', ...projection }] };
        }
        if (String(sql).includes('from public.series_content')) {
          return { rows: written ? [{ id: 'content-uuid', ...projection }] : [] };
        }
        return { rows: [] };
      },
    };

    const result = await applySeriesContent(client, {
      contentRecords,
      sourceRecords,
      runContext: {
        manifestHash: 'c'.repeat(64),
        sourceCount: 1,
        selectedCount: 1,
        selector: { content_type: 'event', limit: 1, offset: 0 },
      },
    });

    expect(result.plan.summary.insert).toBe(1);
    expect(result.verified).toBe(1);
    expect(result.publisherRun.id).toBe('publisher-run-uuid');
    expect(statements.some((sql) => String(sql).includes('translation_jobs'))).toBe(false);
    expect(statements.some((sql) => String(sql).includes('publisher_run_items'))).toBe(true);
    expect(statements).toContain('commit');
  });
});
