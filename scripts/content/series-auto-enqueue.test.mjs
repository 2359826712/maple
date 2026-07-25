import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = resolve(
  'supabase/migrations/202607250001_create_series_translation_auto_enqueue.sql',
);

describe('series translation auto-enqueue migration', () => {
  it('is disabled by default and remains independent from the publisher', async () => {
    const migration = await readFile(migrationPath, 'utf8');

    expect(migration).toMatch(/series_auto_enqueue_enabled boolean not null default false/i);
    expect(migration).toMatch(/run\.status = 'completed'/i);
    expect(migration).toMatch(/run_item\.source_revision = content\.source_revision/i);
    expect(migration).toMatch(/content\.status = 'published'/i);
    expect(migration).toMatch(/content\.source_language = 'en'/i);
    expect(migration).not.toMatch(/create\s+trigger/i);
    expect(migration).not.toMatch(/insert\s+into\s+public\.series_content_translations/i);
  });

  it('is bounded, revision-aware, and idempotent', async () => {
    const migration = await readFile(migrationPath, 'utf8');

    expect(migration).toMatch(/requested_limit < 1 or requested_limit > 500/i);
    expect(migration).toMatch(
      /content_id,\s*target_language,\s*source_revision,\s*policy_version\s*\)\s*do nothing/i,
    );
    expect(migration).toMatch(/array\['title', 'summary'\]::text\[\]/i);
    expect(migration).toMatch(/values \('zh'\), \('zh-Hant'\), \('ja'\), \('ko'\)/i);
    expect(migration).toMatch(/security definer/i);
    expect(migration).toMatch(/grant execute[\s\S]*to service_role/i);
  });
});
