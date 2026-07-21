import { describe, expect, it, vi } from 'vitest';
import { translateFieldsWithOllama } from './ollama-provider.mjs';

describe('Ollama provider', () => {
  it('uses a strict translation prompt and structured field schema', async () => {
    const fetchImpl = vi.fn(async (url, request) => {
      expect(String(url)).toBe('http://ollama.test:11434/api/chat');
      const body = JSON.parse(request.body);
      expect(body.stream).toBe(false);
      expect(body.options.temperature).toBe(0);
      expect(body.format.required).toEqual(['title', 'summary']);
      expect(body.messages[0].content).toContain('Do not summarize');
      return new Response(JSON.stringify({
        model: 'qwen3:8b',
        message: { content: JSON.stringify({ title: '夏季活动', summary: '新活动开始了。' }) },
      }), { headers: { 'Content-Type': 'application/json' } });
    });
    const result = await translateFieldsWithOllama({
      fieldNames: ['title', 'summary'],
      source: { title: 'Summer Event', summary: 'A new event starts.' },
      sourceLanguage: 'en',
      targetLanguage: 'zh',
      endpoint: 'http://ollama.test:11434',
      model: 'qwen3:8b',
      fetchImpl,
    });
    expect(result.provider).toBe('ollama');
    expect(result.model).toBe('qwen3:8b');
    expect(result.fields.title).toBe('夏季活动');
  });

  it('rejects added fields from a model response', async () => {
    await expect(translateFieldsWithOllama({
      fieldNames: ['title'],
      source: { title: 'Summer Event' },
      sourceLanguage: 'en',
      targetLanguage: 'zh',
      endpoint: 'http://ollama.test:11434',
      model: 'qwen3:8b',
      fetchImpl: async () => new Response(JSON.stringify({
        message: { content: JSON.stringify({ title: '夏季活动', explanation: 'extra' }) },
      })),
    })).rejects.toThrow(/unexpected translation fields/);
  });
});
