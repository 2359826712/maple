import { describe, expect, it, vi } from 'vitest';
import { invokeLocalizationProvider } from './localization-provider.mjs';
import { createLocalModelProvider, localModelRuntime } from './local-model-provider.mjs';

const request = {
  fieldNames: ['title', 'summary'],
  source: { title: 'MapleStory update', summary: 'Nexon published an update.' },
  sourceLanguage: 'en',
  targetLanguage: 'zh',
  glossary: [{ source: 'MapleStory', target: '冒险岛' }],
};

describe('local model localization provider', () => {
  it('uses a deterministic non-publishable mock without network access', async () => {
    const fetchImpl = vi.fn();
    const provider = createLocalModelProvider({ environment: {}, fetchImpl });
    const times = [10, 14];
    const translated = await invokeLocalizationProvider({
      provider,
      request,
      now: () => times.shift(),
    });

    expect(translated).toEqual({
      fields: {
        title: '[mock:zh] MapleStory update',
        summary: '[mock:zh] Nexon published an update.',
      },
      provider: 'local',
      transport: 'mock',
      publishable: false,
      model: 'unconfigured',
      model_version: 'unconfigured',
      latency_ms: 4,
      usage: { input_fields: 2, mock: true },
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('keeps the future HTTP model contract behind environment configuration', async () => {
    const fetchImpl = vi.fn(async (_url, init) => {
      expect(JSON.parse(init.body)).toEqual({
        provider: 'local',
        model: 'configured-at-runtime',
        source_language: 'en',
        target_language: 'zh',
        fields: request.source,
        glossary: request.glossary,
      });
      expect(init.headers.Authorization).toBe('Bearer secret');
      return new Response(JSON.stringify({
        translated_fields: { title: '冒险岛更新', summary: 'Nexon 发布了更新。' },
        model: 'configured-at-runtime',
        version: 'server-v1',
        usage: { input_tokens: 12, output_tokens: 8 },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    const provider = createLocalModelProvider({
      environment: {
        LOCAL_MODEL_TRANSPORT: 'http',
        LOCAL_MODEL_PROVIDER: 'local',
        LOCAL_MODEL_API_URL: 'http://model-host.local/v1/localize',
        LOCAL_MODEL_API_KEY: 'secret',
        LOCAL_MODEL_PUBLISHABLE: 'true',
        MODEL_NAME: 'configured-at-runtime',
        MODEL_VERSION: 'client-v1',
      },
      fetchImpl,
    });
    const result = await invokeLocalizationProvider({ provider, request });

    expect(result.fields).toEqual({ title: '冒险岛更新', summary: 'Nexon 发布了更新。' });
    expect(result.model).toBe('configured-at-runtime');
    expect(result.model_version).toBe('server-v1');
    expect(result.publishable).toBe(true);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('requires URL and model configuration only when HTTP transport is selected', () => {
    expect(() => localModelRuntime({ LOCAL_MODEL_TRANSPORT: 'http' })).toThrow(/LOCAL_MODEL_API_URL/);
    expect(() => localModelRuntime({
      LOCAL_MODEL_TRANSPORT: 'http',
      LOCAL_MODEL_API_URL: 'http://model-host.local/v1/localize',
    })).toThrow(/MODEL_NAME/);
  });
});
