import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildProviderEvaluationPlan, runProviderEvaluation } from './provider-evaluation.mjs';
import { readProviderPolicy } from './translation-provider-policy.mjs';

const sample = Array.from({ length: 5 }, (_, index) => ({
  content_id: `content-${index}`,
  module: 'news',
  target_language: 'zh',
  field_names: ['title', 'summary'],
}));

describe('provider evaluation contract', () => {
  it('plans five content rows by three providers without display writes', async () => {
    const policy = await readProviderPolicy(path.resolve('config/translation-provider-policy.json'));
    const plan = buildProviderEvaluationPlan({
      sample,
      policy,
      environment: { LIBRETRANSLATE_API_URL: 'https://translate.test/translate' },
    });
    expect(plan.sample_size).toBe(5);
    expect(plan.candidate_count).toBe(15);
    expect(plan.ready_count).toBe(5);
    expect(plan.unavailable_count).toBe(10);
  });

  it('creates an isolated private evaluation table', async () => {
    const migration = await readFile(
      path.resolve('supabase/migrations/202607210006_create_translation_provider_evaluations.sql'),
      'utf8',
    );
    expect(migration).toContain('translation_provider_evaluations');
    expect(migration).toContain('enable row level security');
    expect(migration).toContain('revoke all');
    expect(migration).not.toMatch(/insert\s+into\s+public\.series_content_translations/i);
    expect(migration).not.toMatch(/alter\s+table\s+public\.series_content_translations/i);
  });

  it('stores unavailable and completed candidates only in the evaluation table', async () => {
    const policy = await readProviderPolicy(path.resolve('config/translation-provider-policy.json'));
    const statements = [];
    const client = {
      async query(sql, parameters) {
        statements.push({ sql: String(sql), parameters });
        return { rowCount: 1, rows: [] };
      },
    };
    const results = await runProviderEvaluation({
      client,
      sample: [{
        release_id: 'release-1',
        content_id: '00000000-0000-4000-8000-000000000001',
        field_names: ['title', 'summary'],
        source_revision: `sha256:${'a'.repeat(64)}`,
        source_language: 'en',
        target_language: 'zh',
        policy_version: '1',
        module: 'news',
        title: 'MapleStory 24',
        summary: 'Nexon update 24.',
      }],
      policy,
      glossary: {
        glossary_version: '1',
        locales: { zh: [{ source: 'MapleStory', target: '冒险岛' }, { source: 'Nexon', target: 'Nexon' }] },
        locale_strategies: { zh: { status: 'enabled', pipeline: ['libretranslate:zh-Hans'] } },
      },
      environment: { LIBRETRANSLATE_API_URL: 'https://translate.test/translate' },
      fetchImpl: async (_url, request) => {
        const body = JSON.parse(request.body);
        return new Response(JSON.stringify({ translatedText: body.q }), {
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });
    expect(results.map((result) => [result.provider, result.status])).toEqual([
      ['deepl', 'unavailable'],
      ['ollama', 'unavailable'],
      ['libretranslate', 'completed'],
    ]);
    expect(statements).toHaveLength(3);
    expect(statements.every(({ sql }) => sql.includes('translation_provider_evaluations'))).toBe(true);
    expect(statements.every(({ sql }) => !/series_content_translations/i.test(sql))).toBe(true);
  });
});
