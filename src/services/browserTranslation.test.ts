// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { translateHtml, translateText } from './browserTranslation';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('browser translation', () => {
  it('uses the browser Translator API for dynamic text', async () => {
    const translate = vi.fn(async (input: string) => `译：${input}`);
    vi.stubGlobal('Translator', {
      availability: vi.fn(async () => 'available'),
      create: vi.fn(async () => ({ translate })),
    });

    await expect(translateText('닉네임 옥션', 'ko', 'zh')).resolves.toBe('译：닉네임 옥션');
  });

  it('translates HTML text while preserving article markup and code', async () => {
    vi.stubGlobal('Translator', {
      availability: vi.fn(async () => 'available'),
      create: vi.fn(async () => ({ translate: async (input: string) => `中:${input}` })),
    });

    const html = await translateHtml('<h2>Overview</h2><p>Boss mechanics</p><pre>const boss = true;</pre>', 'en', 'zh-Hant');
    expect(html).toContain('<h2>中:Overview</h2>');
    expect(html).toContain('<p>中:Boss mechanics</p>');
    expect(html).toContain('<pre>const boss = true;</pre>');
  });
});
