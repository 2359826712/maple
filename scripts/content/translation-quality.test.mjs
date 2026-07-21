import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  protectGlossaryFields,
  readTranslationGlossary,
  restoreAndCheckTranslation,
} from './translation-quality.mjs';

const glossary = {
  schema_version: 1,
  glossary_version: '1',
  locales: {
    zh: [
      { source: 'MapleStory Worlds', target: 'MapleStory Worlds' },
      { source: 'MapleStory', target: '冒险岛' },
      { source: 'Nexon', target: 'Nexon' },
    ],
  },
  locale_strategies: {
    zh: { status: 'enabled', pipeline: ['libretranslate:zh-Hans'] },
  },
};

describe('translation quality layer', () => {
  it('protects longest glossary terms and restores a structured field result', () => {
    const source = {
      title: 'MapleStory Worlds Update 24',
      summary: 'Nexon released MapleStory update 24.',
    };
    const protectedFields = protectGlossaryFields({
      fieldNames: ['title', 'summary'],
      source,
      targetLanguage: 'zh',
      glossary,
    });
    expect(protectedFields.replacements.map((entry) => entry.source)).toEqual([
      'MapleStory Worlds',
      'MapleStory',
      'Nexon',
    ]);
    const quality = restoreAndCheckTranslation({
      fieldNames: ['title', 'summary'],
      source,
      protectedFields,
      translated: {
        title: `${protectedFields.replacements[0].token} 更新 24`,
        summary: `${protectedFields.replacements[2].token} 发布了 ${protectedFields.replacements[1].token} 更新 24。`,
      },
      glossary,
    });

    expect(quality.fields).toEqual({
      title: 'MapleStory Worlds 更新 24',
      summary: 'Nexon 发布了 冒险岛 更新 24。',
    });
    expect(quality.review_status).toBe('automatic');
    expect(quality.quality_checks.numbers_match).toBe(true);
    expect(quality.quality_checks.glossary_match).toBe(true);
  });

  it('routes changed numbers and damaged placeholders to needs_review', () => {
    const source = { title: 'MapleStory 24' };
    const protectedFields = protectGlossaryFields({
      fieldNames: ['title'], source, targetLanguage: 'zh', glossary,
    });
    const quality = restoreAndCheckTranslation({
      fieldNames: ['title'],
      source,
      protectedFields,
      translated: { title: '__BROKEN__ 25' },
      glossary,
    });
    expect(quality.review_status).toBe('needs_review');
    expect(quality.quality_checks.numbers_match).toBe(false);
    expect(quality.quality_checks.placeholders_match).toBe(false);
  });

  it('records zh-Hant as blocked instead of pretending zh-Hans is Traditional Chinese', async () => {
    const configured = await readTranslationGlossary(path.resolve('config/translation-glossary.json'));
    expect(configured.locale_strategies['zh-Hant'].status).toBe('blocked');
    expect(configured.locales['zh-Hant']).toBeUndefined();
    expect(() => protectGlossaryFields({
      fieldNames: ['title'],
      source: { title: 'MapleStory' },
      targetLanguage: 'zh-Hant',
      glossary: configured,
    })).toThrow(/target language zh-Hant is blocked/);
  });

  it('keeps display identity stable while adding review gating metadata', async () => {
    const migration = await import('node:fs/promises').then(({ readFile }) => (
      readFile('supabase/migrations/202607210005_add_translation_quality_layer.sql', 'utf8')
    ));
    expect(migration).toContain('quality_checks jsonb');
    expect(migration).toContain("'needs_review'");
    expect(migration).toContain("'approved'");
    expect(migration).toContain('Public can read content translations');
    expect(migration).not.toMatch(/drop\s+constraint\s+.*pkey/i);
  });
});
