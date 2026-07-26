import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const migrationUrl = new URL(
  '../../supabase/migrations/202607250004_native_localization_v1.sql',
  import.meta.url,
);

describe('native-localization-v1 migration', () => {
  it('keeps old rows until an atomic replacement and archives them', async () => {
    const sql = await readFile(migrationUrl, 'utf8');
    expect(sql).toMatch(/archive_ui_translation_before_replace/i);
    expect(sql).toMatch(/archive_series_translation_before_replace/i);
    expect(sql).toMatch(/localization_audit\.ui_translations_history/i);
    expect(sql).toMatch(/localization_audit\.series_content_translations_history/i);
    expect(sql).not.toMatch(/delete\s+from\s+public\.(?:ui_translations|series_content_translations)/i);
  });

  it('uses the native policy and prioritizes newly verified content', async () => {
    const sql = await readFile(migrationUrl, 'utf8');
    expect(sql).toContain("'native-localization-v1'");
    expect(sql).toMatch(/then 1000/i);
    expect(sql).toMatch(/source\.localization_priority desc/i);
    expect(sql).toMatch(/translation\.prompt_version = selected_policy_version/i);
    expect(sql).toMatch(/array\['title',[\s\S]*'body_html'/i);
  });

  it('isolates Wiki work and does not silently switch the legacy EXE queue', async () => {
    const sql = await readFile(migrationUrl, 'utf8');
    expect(sql).toMatch(/create table if not exists public\.wiki_localization_jobs/i);
    expect(sql).toMatch(/claim_wiki_localization_jobs/i);
    expect(sql).toMatch(/enqueue_native_series_localization_jobs/i);
    expect(sql).not.toMatch(/create or replace function public\.enqueue_series_translation_jobs/i);
    expect(sql).not.toMatch(/update public\.localization_automation_settings/i);
    expect(sql).not.toMatch(/^\s*(?:begin|commit);\s*$/im);
  });
});
