import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  providerAvailability,
  providersForFields,
  readProviderPolicy,
  validateProviderPolicy,
} from './translation-provider-policy.mjs';

describe('translation provider policy', () => {
  it('keeps the phase 2D comparison at five rows and three providers', async () => {
    const policy = await readProviderPolicy(path.resolve('config/translation-provider-policy.json'));
    expect(policy.evaluation).toEqual({
      sample_size: 5,
      target_language: 'zh',
      providers: ['deepl', 'ollama', 'libretranslate'],
    });
    expect(providersForFields({
      module: 'news',
      fieldNames: ['title', 'summary'],
      policy,
    })).toEqual(['deepl', 'ollama', 'libretranslate']);
  });

  it('reports missing environment names without exposing values', async () => {
    const policy = await readProviderPolicy(path.resolve('config/translation-provider-policy.json'));
    expect(providerAvailability('deepl', policy, {})).toEqual({
      ready: false,
      missing: ['DEEPL_API_KEY'],
    });
    expect(providerAvailability('libretranslate', policy, {
      LIBRETRANSLATE_API_URL: 'https://example.test/translate',
    })).toEqual({ ready: true, missing: [] });
  });

  it('rejects evaluation expansion', async () => {
    const policy = await readProviderPolicy(path.resolve('config/translation-provider-policy.json'));
    expect(validateProviderPolicy({
      ...policy,
      evaluation: { ...policy.evaluation, sample_size: 100 },
    })).toContain('evaluation sample_size must remain exactly 5');
  });
});
