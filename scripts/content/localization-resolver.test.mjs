import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { localizationMemoryRows, readLocalizationAssets } from './localization-assets.mjs';
import { resolveLocalization, resolveLocalizedField, storeLocalizationResolution } from './localization-resolver.mjs';

function memoryRows(assets) {
  return localizationMemoryRows(assets).map((row, index) => ({ id: `memory-${index}`, ...row }));
}

describe('localization resolver', () => {
  it('resolves exact approved localization before any provider', async () => {
    const assets = await readLocalizationAssets(path.resolve('config/localization-assets.json'));
    const resolved = resolveLocalizedField({
      text: 'Creator Cashout Feature',
      sourceLanguage: 'en',
      targetLanguage: 'zh',
      memory: memoryRows(assets),
      assets,
    });
    expect(resolved).toMatchObject({ text: '创作者提现功能', resolution_type: 'exact' });
  });

  it('requires full glossary coverage instead of partially localizing prose', async () => {
    const assets = await readLocalizationAssets(path.resolve('config/localization-assets.json'));
    const memory = memoryRows(assets);
    expect(resolveLocalizedField({
      text: 'MapleStory Maintenance Notice', sourceLanguage: 'en', targetLanguage: 'zh', memory, assets,
    })).toMatchObject({ text: '冒险岛 维护公告', resolution_type: 'glossary' });
    expect(resolveLocalizedField({
      text: 'MapleStory launches a surprise', sourceLanguage: 'en', targetLanguage: 'zh', memory, assets,
    })).toMatchObject({ text: null, resolution_type: 'unresolved', next: 'provider' });
  });

  it('localizes the recurring creator summary with an approved template and exact title memory', async () => {
    const assets = await readLocalizationAssets(path.resolve('config/localization-assets.json'));
    const memory = memoryRows(assets);
    const resolved = resolveLocalizedField({
      text: '“Creator Income Information” is an official creator announcement from MapleStory Worlds Creator Center News on 2024-10-16. Its canonical Nexon thread and publication metadata are retained for source-backed verification.',
      sourceLanguage: 'en',
      targetLanguage: 'zh',
      memory,
      assets,
    });
    expect(resolved.resolution_type).toBe('template');
    expect(resolved.text).toBe('“创作者收入信息”是 MapleStory Worlds 创作者中心于 2024-10-16 发布的官方创作者公告。保留了 Nexon 官方主题帖及发布元数据，供来源核验。');
  });

  it('resolves the five-row shape without writing the display table', async () => {
    const assets = await readLocalizationAssets(path.resolve('config/localization-assets.json'));
    const content = {
      job_id: '00000000-0000-4000-8000-000000000001',
      content_id: '00000000-0000-4000-8000-000000000002',
      field_names: ['title', 'summary'],
      source_revision: `sha256:${'a'.repeat(64)}`,
      source_language: 'en',
      target_language: 'zh',
      title: 'Creator Income Information',
      summary: '“Creator Income Information” is an official creator announcement from MapleStory Worlds Creator Center News on 2024-10-16. Its canonical Nexon thread and publication metadata are retained for source-backed verification.',
    };
    const resolution = resolveLocalization({
      content,
      memory: memoryRows(assets),
      assets,
      policy: { policy_version: '2', resolution_order: ['exact', 'glossary', 'memory', 'template', 'provider'], provider_fallback: { enabled: false } },
    });
    expect(resolution.status).toBe('resolved');
    expect(resolution.resolution_type).toBe('mixed');
    expect(resolution.localized_fields.title).toBe('创作者收入信息');
    const statements = [];
    await storeLocalizationResolution({
      async query(sql) { statements.push(String(sql)); return { rowCount: 1, rows: [] }; },
    }, resolution);
    expect(statements).toHaveLength(2);
    expect(statements[0]).toContain('localization_resolutions');
    expect(statements[1]).toContain('translation_jobs');
    expect(statements.every((sql) => !/series_content_translations/i.test(sql))).toBe(true);
  });

  it('resolves all five Phase 2B pilot records without an external provider', async () => {
    const assets = await readLocalizationAssets(path.resolve('config/localization-assets.json'));
    const memory = memoryRows(assets);
    const dates = {
      'worlds-creator-circle-applications-open-2024': '2024-10-16',
      'worlds-maplejam-2024': '2024-10-16',
      'worlds-creator-cashout-feature': '2024-10-16',
      'worlds-creator-income-information': '2024-10-16',
      'worlds-creators-workshop-applications-closed': '2024-10-22',
    };
    const pilot = assets.exact.filter((entry) => dates[entry.id]);
    expect(pilot).toHaveLength(5);
    for (const [index, entry] of pilot.entries()) {
      const date = dates[entry.id];
      const resolution = resolveLocalization({
        content: {
          job_id: `job-${index}`,
          content_id: `content-${index}`,
          field_names: ['title', 'summary'],
          source_revision: `sha256:${String(index).repeat(64)}`,
          source_language: 'en',
          target_language: 'zh',
          title: entry.source,
          summary: `“${entry.source}” is an official creator announcement from MapleStory Worlds Creator Center News on ${date}. Its canonical Nexon thread and publication metadata are retained for source-backed verification.`,
        },
        memory,
        assets,
        policy: { policy_version: '2', resolution_order: ['exact', 'glossary', 'memory', 'template', 'provider'], provider_fallback: { enabled: false } },
      });
      expect(resolution.status, entry.id).toBe('resolved');
      expect(resolution.localized_fields.title, entry.id).toBe(entry.localized);
      expect(resolution.resolution_metadata.provider_fallback_enabled).toBe(false);
    }
  });

  it('keeps localization candidate tables private and display-independent', async () => {
    const migration = await readFile(
      path.resolve('supabase/migrations/202607210007_create_localization_foundation.sql'),
      'utf8',
    );
    expect(migration).toContain('create table if not exists public.localization_memory');
    expect(migration).toContain('create table if not exists public.localization_resolutions');
    expect(migration).toContain('enable row level security');
    expect(migration).not.toMatch(/insert\s+into\s+public\.series_content_translations/i);
  });
});
