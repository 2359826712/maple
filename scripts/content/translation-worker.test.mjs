import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { translateFieldsWithLibre } from './libretranslate-provider.mjs';

describe('translation worker MVP', () => {
  it('sends structured fields as a batch and reconstructs a field object', async () => {
    const fetchImpl = vi.fn(async (_url, request) => {
      expect(JSON.parse(request.body)).toEqual({
        q: ['Summer Event', 'Join the event.'],
        source: 'en',
        target: 'zh-Hans',
        format: 'text',
      });
      return new Response(JSON.stringify({ translatedText: ['夏季活动', '参加活动。'] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    const translated = await translateFieldsWithLibre({
      fieldNames: ['title', 'summary'],
      source: { title: 'Summer Event', summary: 'Join the event.' },
      sourceLanguage: 'en',
      targetLanguage: 'zh',
      endpoint: 'https://translate.example/translate',
      fetchImpl,
    });

    expect(translated).toEqual({
      fields: { title: '夏季活动', summary: '参加活动。' },
      provider: 'libretranslate',
      model: 'argos',
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('rejects incomplete provider output instead of writing partial translations', async () => {
    await expect(translateFieldsWithLibre({
      fieldNames: ['title', 'summary'],
      source: { title: 'Title', summary: 'Summary' },
      sourceLanguage: 'en',
      targetLanguage: 'zh',
      endpoint: 'https://translate.example/translate',
      fetchImpl: async () => new Response(JSON.stringify({ translatedText: ['标题'] })),
    })).rejects.toThrow(/invalid response/);
  });

  it('adds provider model metadata without changing the display-table primary key', async () => {
    const migration = await readFile(
      path.resolve('supabase/migrations/202607210004_add_translation_worker_metadata.sql'),
      'utf8',
    );
    expect(migration).toContain("add column if not exists model");
    expect(migration).not.toMatch(/drop constraint|drop primary key/i);
  });
});
