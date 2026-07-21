import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildTranslationQueueRows } from './translation-queue.mjs';

const revision = `sha256:${'a'.repeat(64)}`;
const job = {
  policy_version: '1',
  entity_type: 'series_content',
  series_id: 'maplestory-pc',
  module: 'news',
  slug: 'example',
  source_revision: revision,
  source_language: 'en',
  target_language: 'zh',
  fields: ['title', 'summary'],
};

describe('translation queue contract', () => {
  it('creates one bundled content-locale task with traceable release and policy identities', () => {
    const rows = buildTranslationQueueRows({
      release_id: 'content-example',
      jobs: [job],
    }, [{
      id: '00000000-0000-0000-0000-000000000001',
      series_id: job.series_id,
      module: job.module,
      slug: job.slug,
      source_revision: revision,
      source_language: 'en',
    }]);

    expect(rows).toEqual([{
      release_id: 'content-example',
      content_id: '00000000-0000-0000-0000-000000000001',
      entity_type: 'series_content',
      field_names: ['title', 'summary'],
      source_revision: revision,
      source_language: 'en',
      target_language: 'zh',
      policy_version: '1',
    }]);
  });

  it('rejects missing content and changed source input before enqueueing', () => {
    expect(() => buildTranslationQueueRows({ release_id: 'content-example', jobs: [job] }, []))
      .toThrow(/cannot resolve content UUID/);
    expect(() => buildTranslationQueueRows({ release_id: 'content-example', jobs: [job] }, [{
      id: '00000000-0000-0000-0000-000000000001',
      series_id: job.series_id,
      module: job.module,
      slug: job.slug,
      source_revision: `sha256:${'b'.repeat(64)}`,
      source_language: 'en',
    }])).toThrow(/source revision changed/);
  });

  it('defines an idempotent queue and atomic skip-locked claim without a worker', async () => {
    const migration = await readFile(
      path.resolve('supabase/migrations/202607210003_create_translation_jobs.sql'),
      'utf8',
    );
    expect(migration).toContain('translation_jobs_identity_unique');
    expect(migration).toContain('for update skip locked');
    expect(migration).toContain("status = 'processing'");
    expect(migration).not.toMatch(/libretranslate|deepl|ollama/i);
  });
});
