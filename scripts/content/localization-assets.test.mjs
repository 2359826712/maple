import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  localizationMemoryRows,
  localizationSourceHash,
  readLocalizationAssets,
  validateLocalizationAssets,
} from './localization-assets.mjs';
import { readTranslationPolicy } from './translation-policy.mjs';

describe('localization assets', () => {
  it('expands versioned glossary and exact assets into approved memory rows', async () => {
    const assets = await readLocalizationAssets(path.resolve('config/localization-assets.json'));
    const rows = localizationMemoryRows(assets);
    expect(assets.asset_version).toBe('1');
    expect(rows).toHaveLength(14);
    expect(rows.find((row) => row.asset_id === 'maplestory-official-name' && row.target_language === 'zh'))
      .toMatchObject({ localized_text: '冒险岛', memory_type: 'official', review_status: 'approved' });
    expect(rows.every((row) => row.source_hash === localizationSourceHash(row.source_text))).toBe(true);
  });

  it('rejects unapproved templates and duplicate asset ids', async () => {
    const assets = await readLocalizationAssets(path.resolve('config/localization-assets.json'));
    const invalid = {
      ...assets,
      templates: [{ ...assets.templates[0], id: assets.glossary[0].id, review_status: 'pending' }],
    };
    const errors = validateLocalizationAssets(invalid);
    expect(errors.some((error) => error.includes('repeated asset id'))).toBe(true);
    expect(errors.some((error) => error.includes('must be approved'))).toBe(true);
  });

  it('uses localization-first policy v2 with provider fallback disabled', async () => {
    const policy = await readTranslationPolicy(path.resolve('config/translation-policy.json'));
    expect(policy.policy_version).toBe('2');
    expect(policy.resolution_order).toEqual(['exact', 'glossary', 'memory', 'template', 'provider']);
    expect(policy.provider_fallback.enabled).toBe(false);
  });
});
