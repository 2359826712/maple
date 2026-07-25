import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const migrationPath = new URL(
  '../../supabase/migrations/202607250002_auto_publish_passed_local_model_translations.sql',
  import.meta.url,
);

describe('local-model translation auto-publish policy', () => {
  it('publishes only current translations from the approved pipeline with passing checks', async () => {
    const migration = await readFile(migrationPath, 'utf8');

    expect(migration).toContain("new.review_status = 'needs_review'");
    expect(migration).toContain("new.provider = 'local_model'");
    expect(migration).toContain("new.model = 'maplestory-qwen2.5-7b-q4_k_m'");
    expect(migration).toContain(
      "new.quality_checks->>'pipeline_version' = 'series-title-summary-v2-20260724'",
    );
    expect(migration).toContain('"status": "passed"');
    expect(migration).toContain('"numbers_and_dates": true');
    expect(migration).toContain('content.source_revision = new.source_revision');
    expect(migration).toContain("new.review_status := 'automatic'");
  });

  it('promotes existing compatible rows without approving legacy or failed output', async () => {
    const migration = await readFile(migrationPath, 'utf8');

    expect(migration).toMatch(/update public\.series_content_translations as translation/i);
    expect(migration).toContain("translation.review_status = 'needs_review'");
    expect(migration).toContain(
      "translation.quality_checks->>'pipeline_version' = 'series-title-summary-v2-20260724'",
    );
    expect(migration).not.toMatch(/where\s+translation\.review_status\s*=\s*'needs_review'\s*;/i);
  });
});
