import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const migrationPath = new URL(
  '../../supabase/migrations/202607250003_create_ui_translations.sql',
  import.meta.url,
);

describe('UI translation storage', () => {
  it('keeps interface strings separate from content translations', async () => {
    const migration = await readFile(migrationPath, 'utf8');

    expect(migration).toMatch(/create table if not exists public\.ui_translations/i);
    expect(migration).toContain('primary key (translation_key, locale)');
    expect(migration).toContain("locale in ('zh', 'zh-Hant', 'ja', 'ko')");
    expect(migration).toContain('source_hash text not null');
    expect(migration).toContain('translated_text text not null');
    expect(migration).toContain('quality_checks jsonb');
    expect(migration).not.toMatch(/references public\.series_content/i);
  });

  it('publishes only automatic or approved interface strings', async () => {
    const migration = await readFile(migrationPath, 'utf8');

    expect(migration).toContain("review_status in ('pending', 'automatic', 'approved', 'stale', 'rejected')");
    expect(migration).toContain("quality_checks->>'status' = 'passed'");
    expect(migration).toContain("using (review_status in ('automatic', 'approved'))");
    expect(migration).toContain(
      'revoke insert, update, delete on public.ui_translations from anon, authenticated',
    );
  });
});
