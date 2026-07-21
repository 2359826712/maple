import { describe, expect, it, vi } from 'vitest';
import { translateFieldsWithDeepL } from './deepl-provider.mjs';

describe('DeepL provider', () => {
  it('uses header authentication, explicit zh-Hans, and ordered fields', async () => {
    const fetchImpl = vi.fn(async (url, request) => {
      expect(String(url)).toBe('https://api-free.deepl.com/v2/translate');
      expect(request.headers.Authorization).toBe('DeepL-Auth-Key secret');
      const body = JSON.parse(request.body);
      expect(body.text).toEqual(['Summer Event', 'Join the event.']);
      expect(body.source_lang).toBe('EN');
      expect(body.target_lang).toBe('ZH-HANS');
      expect(body.model_type).toBe('prefer_quality_optimized');
      return new Response(JSON.stringify({
        translations: [
          { text: '夏日活动', model_type_used: 'quality_optimized' },
          { text: '参加活动。', model_type_used: 'quality_optimized' },
        ],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    const result = await translateFieldsWithDeepL({
      fieldNames: ['title', 'summary'],
      source: { title: 'Summer Event', summary: 'Join the event.' },
      sourceLanguage: 'en',
      targetLanguage: 'zh',
      apiKey: 'secret',
      fetchImpl,
    });
    expect(result).toEqual({
      fields: { title: '夏日活动', summary: '参加活动。' },
      provider: 'deepl',
      model: 'quality_optimized',
    });
  });

  it('maps zh-Hant explicitly instead of treating it as simplified Chinese', async () => {
    const fetchImpl = vi.fn(async (_url, request) => {
      expect(JSON.parse(request.body).target_lang).toBe('ZH-HANT');
      return new Response(JSON.stringify({ translations: [{ text: '傳統中文' }] }));
    });
    await translateFieldsWithDeepL({
      fieldNames: ['title'],
      source: { title: 'Traditional Chinese' },
      sourceLanguage: 'en',
      targetLanguage: 'zh-Hant',
      apiKey: 'secret',
      fetchImpl,
    });
  });
});
