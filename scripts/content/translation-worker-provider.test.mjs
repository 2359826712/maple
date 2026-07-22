import { describe, expect, it, vi } from 'vitest';
import { createLocalModelProvider } from './local-model-provider.mjs';
import { previewTranslationWorker, runTranslationWorker } from './translation-worker.mjs';

const glossary = {
  glossary_version: '1',
  locales: { zh: [] },
  locale_strategies: { zh: { status: 'enabled', pipeline: ['provider'] } },
};

describe('translation worker provider boundary', () => {
  it('refuses to claim jobs with a mock provider', async () => {
    const client = { query: vi.fn() };
    await expect(runTranslationWorker({
      client,
      workerId: 'worker-test',
      limit: 1,
      glossary,
      provider: createLocalModelProvider({ environment: {} }),
    })).rejects.toThrow(/preview mode/);
    expect(client.query).not.toHaveBeenCalled();
  });

  it('previews pending jobs through the mock provider without writes', async () => {
    const client = {
      query: vi.fn(async (sql) => {
        expect(sql).toContain("job.status in ('pending', 'retry')");
        expect(sql).not.toMatch(/insert|update|delete/i);
        return {
          rows: [{
            id: 'job-1',
            content_id: 'content-1',
            field_names: ['title', 'summary'],
            source_revision: 'sha256:source',
            source_language: 'en',
            target_language: 'zh',
            title: 'Update title',
            summary: 'Update summary',
            body_html: '',
            current_source_revision: 'sha256:source',
            current_source_language: 'en',
          }],
        };
      }),
    };
    const previews = await previewTranslationWorker({
      client,
      provider: createLocalModelProvider({ environment: {} }),
      glossary,
      limit: 1,
      targetLanguage: 'zh',
    });

    expect(previews).toHaveLength(1);
    expect(previews[0].translated.provider).toBe('local');
    expect(previews[0].translated.transport).toBe('mock');
    expect(previews[0].translated.review_status).toBe('needs_review');
    expect(client.query).toHaveBeenCalledOnce();
  });
});
