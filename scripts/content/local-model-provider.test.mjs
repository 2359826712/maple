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

  it('adapts llama.cpp OpenAI-compatible chat completions without enabling publication', async () => {
    const fetchImpl = vi.fn(async (_url, init) => {
      const body = JSON.parse(init.body);
      expect(body).toMatchObject({
        model: 'maplestory-qwen2.5-7b-q4_k_m',
        temperature: 0,
        stream: false,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'maplestory_localization', strict: true },
        },
      });
      expect(JSON.parse(body.messages[1].content)).toEqual({
        fields: request.source,
        glossary: request.glossary,
      });
      expect(body.messages[0].content).toContain('Translate from English to Simplified Chinese');
      expect(init.headers.Authorization).toBe('Bearer secret');
      return new Response(JSON.stringify({
        id: 'chatcmpl-test',
        model: 'maplestory-qwen2.5-7b-q4_k_m',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: JSON.stringify({
              translated_fields: { title: '冒险岛更新', summary: 'Nexon 发布了更新。' },
            }),
          },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    const provider = createLocalModelProvider({
      environment: {
        LOCAL_MODEL_TRANSPORT: 'openai',
        LOCAL_MODEL_PROVIDER: 'local',
        LOCAL_MODEL_API_URL: 'http://model-host.local:8990/v1/chat/completions',
        LOCAL_MODEL_API_KEY: 'secret',
        LOCAL_MODEL_PUBLISHABLE: 'true',
        MODEL_NAME: 'maplestory-qwen2.5-7b-q4_k_m',
        MODEL_VERSION: 'Qwen2.5-7B-Instruct-GGUF-Q4_K_M',
      },
      fetchImpl,
    });
    const result = await invokeLocalizationProvider({ provider, request });

    expect(result.fields).toEqual({ title: '冒险岛更新', summary: 'Nexon 发布了更新。' });
    expect(result.model).toBe('maplestory-qwen2.5-7b-q4_k_m');
    expect(result.model_version).toBe('Qwen2.5-7B-Instruct-GGUF-Q4_K_M');
    expect(result.transport).toBe('openai');
    expect(result.publishable).toBe(false);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('requires URL, model identity, version, and key for OpenAI transport', () => {
    expect(() => localModelRuntime({ LOCAL_MODEL_TRANSPORT: 'openai' })).toThrow(/LOCAL_MODEL_API_URL/);
    expect(() => localModelRuntime({
      LOCAL_MODEL_TRANSPORT: 'openai',
      LOCAL_MODEL_API_URL: 'http://model-host.local:8990/v1/chat/completions',
    })).toThrow(/MODEL_NAME/);
    expect(() => localModelRuntime({
      LOCAL_MODEL_TRANSPORT: 'openai',
      LOCAL_MODEL_API_URL: 'http://model-host.local:8990/v1/chat/completions',
      MODEL_NAME: 'runtime-model',
    })).toThrow(/MODEL_VERSION/);
    expect(() => localModelRuntime({
      LOCAL_MODEL_TRANSPORT: 'openai',
      LOCAL_MODEL_API_URL: 'http://model-host.local:8990/v1/chat/completions',
      MODEL_NAME: 'runtime-model',
      MODEL_VERSION: 'runtime-version',
    })).toThrow(/LOCAL_MODEL_API_KEY/);
  });
});
