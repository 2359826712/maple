import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { createContentManifest } from './manifest.mjs';
import {
  assertReleaseMatchesManifest,
  createContentRelease,
  validateContentRelease,
} from './release.mjs';
import {
  buildTranslationPlan,
  canonicalTranslationLocale,
  validateTranslationPolicy,
} from './translation-policy.mjs';

const policy = {
  schema_version: 1,
  policy_version: '1',
  targets: ['zh', 'zh-Hant', 'ja', 'ko'],
  locale_aliases: { 'zh-CN': 'zh', 'zh-TW': 'zh-Hant' },
  modules: {
    news: { fields: ['title', 'summary'] },
    upcoming: { fields: ['title', 'summary'] },
    events: { fields: ['title', 'summary'] },
    shop: { fields: ['title'] },
    guides: { fields: ['title', 'summary'] },
  },
};

function projection(overrides = {}) {
  return {
    source_file: 'content/news/maplestory/2026/example.json',
    series_id: 'maplestory-pc',
    module: 'news',
    slug: 'example',
    source_language: 'en',
    source_revision: `sha256:${'a'.repeat(64)}`,
    title: 'Example title',
    summary: 'Example summary',
    body_html: '<p>Must not be translated.</p>',
    ...overrides,
  };
}

describe('content release contract', () => {
  it('creates a deterministic release that conforms to the JSON schema', async () => {
    const manifest = createContentManifest([{
      relativePath: 'content/news/maplestory/2026/example.json',
      fileHash: 'a'.repeat(64),
      data: { id: 'example', last_checked: '2026-07-21T00:00:00.000Z' },
    }], [{
      relativePath: 'sources/maplestory/example.json',
      fileHash: 'b'.repeat(64),
      data: { id: 'example' },
    }]);
    const release = createContentRelease(manifest);
    const schema = JSON.parse(await readFile(path.resolve('schemas/content-release.schema.json'), 'utf8'));
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    expect(validate(release), JSON.stringify(validate.errors)).toBe(true);
    expect(validateContentRelease(release)).toEqual([]);
    expect(() => assertReleaseMatchesManifest(release, manifest)).not.toThrow();
    expect(() => assertReleaseMatchesManifest({ ...release, files: 2 }, manifest)).toThrow(/files count/);
  });
});

describe('translation policy planning', () => {
  it('normalizes public locale aliases at the policy boundary', () => {
    expect(canonicalTranslationLocale('zh-CN', policy)).toBe('zh');
    expect(canonicalTranslationLocale('zh-TW', policy)).toBe('zh-Hant');
    expect(canonicalTranslationLocale('ja', policy)).toBe('ja');
    expect(() => canonicalTranslationLocale('fr', policy)).toThrow(/unsupported locale/);
  });

  it('never includes body_html and applies module-specific fields', () => {
    const plan = buildTranslationPlan({
      projections: [projection(), projection({
        source_file: 'content/cash-shop/maplestory/2026/shop-example.json',
        module: 'shop',
        slug: 'shop-example',
      })],
      policy,
      targetLocales: ['zh-CN'],
    });

    expect(plan.summary.jobs).toBe(2);
    expect(plan.policy_version).toBe('1');
    expect(plan.jobs.every((job) => job.policy_version === '1')).toBe(true);
    expect(plan.jobs.every((job) => job.target_language === 'zh')).toBe(true);
    expect(plan.jobs.find((job) => job.slug === 'example').fields).toEqual(['title', 'summary']);
    expect(plan.jobs.find((job) => job.slug === 'shop-example').fields).toEqual(['title']);
    expect(plan.jobs.flatMap((job) => job.fields)).not.toContain('body_html');
  });

  it('rejects body_html policy, unknown modules, and missing revisions', () => {
    expect(validateTranslationPolicy({ ...policy, policy_version: 'v1' }))
      .toContain('policy_version must be a positive integer string');
    expect(validateTranslationPolicy({
      ...policy,
      modules: { ...policy.modules, news: { fields: ['title', 'body_html'] } },
    })).toContain('module news cannot translate field "body_html"');
    expect(() => buildTranslationPlan({
      projections: [projection({ module: 'tools' })],
      policy,
      targetLocales: ['zh'],
    })).toThrow(/no translation policy/);
    expect(() => buildTranslationPlan({
      projections: [projection({ source_revision: null })],
      policy,
      targetLocales: ['zh'],
    })).toThrow(/source_revision is required/);
  });

  it('plans exactly 100 read-only candidates for the first zh pilot', () => {
    const projections = Array.from({ length: 120 }, (_, index) => projection({
      source_file: `content/news/maplestory/2026/example-${String(index).padStart(3, '0')}.json`,
      slug: `example-${index}`,
    }));
    const plan = buildTranslationPlan({ projections, policy, targetLocales: ['zh'], limit: 100 });

    expect(plan.summary).toEqual({ content_available: 120, content_selected: 100, jobs: 100 });
    expect(plan.mappings.locales).toEqual({ zh: 100 });
  });

  it('can scope a pilot to one configured module', () => {
    const plan = buildTranslationPlan({
      projections: [projection(), projection({ module: 'shop', slug: 'shop-example' })],
      policy,
      targetLocales: ['zh'],
      module: 'news',
    });

    expect(plan.summary).toEqual({ content_available: 1, content_selected: 1, jobs: 1 });
    expect(plan.jobs[0].module).toBe('news');
  });

  it('adds release storage only and does not introduce translation_jobs', async () => {
    const migration = await readFile(path.resolve('supabase/migrations/202607210002_create_content_releases.sql'), 'utf8');
    expect(migration).toContain('create table if not exists public.content_releases');
    expect(migration).toContain('add column if not exists release_id');
    expect(migration).not.toContain('translation_jobs');
  });
});
