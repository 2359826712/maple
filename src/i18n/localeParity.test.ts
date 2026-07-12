import { describe, expect, it } from 'vitest';
import en from './local/en/common';
import ja from './local/ja/common';
import zh from './local/zh/common';
import zhHant from './local/zh-Hant/common';
import { dailyHubs, quickTools, themePresets } from '../mocks/home';

const locales = { en, ja, zh, 'zh-Hant': zhHant } as const;
const sourceModules = import.meta.glob('../**/*.{ts,tsx}', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

describe('supported locale key parity', () => {
  it.each(Object.entries(locales))('%s contains exactly the English key set', (_locale, messages) => {
    expect(Object.keys(messages).sort()).toEqual(Object.keys(en).sort());
  });

  it.each(Object.entries(locales))('%s has no blank translations', (_locale, messages) => {
    for (const [key, value] of Object.entries(messages)) {
      expect(value, key).toBeTypeOf('string');
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('declares every literal translation key used by application code', () => {
    const missing = new Set<string>();
    const keyPattern = /\bt\(\s*(['"])([^'"]+)\1\s*(?=[,)])/g;

    for (const [path, source] of Object.entries(sourceModules)) {
      if (path.endsWith('localeParity.test.ts')) continue;
      for (const match of source.matchAll(keyPattern)) {
        if (!(match[2] in en)) missing.add(`${match[2]} (${path})`);
      }
    }

    expect([...missing].sort()).toEqual([]);
  });

  it.each(Object.entries(locales))('%s declares homepage data-driven translation keys', (_locale, messages) => {
    const keys = [
      ...dailyHubs.flatMap((hub) => [hub.titleKey, hub.descKey, hub.actionKey]),
      ...quickTools.flatMap((tool) => [tool.titleKey, tool.descKey]),
      ...themePresets.map((preset) => preset.nameKey),
    ];

    for (const key of keys) {
      expect(messages, key).toHaveProperty(key);
    }
  });
});
