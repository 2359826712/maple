import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('static application loading', () => {
  it('bundles every route without runtime code splitting', () => {
    const router = source('router/config.tsx');
    expect(router).not.toMatch(/\blazy\s*\(/);
    expect(router).not.toMatch(/\bimport\s*\(/);
  });

  it('bundles every locale without an asynchronous locale backend', () => {
    const i18n = source('i18n/index.ts');
    expect(i18n).not.toMatch(/\bimport\s*\(/);
    expect(i18n).not.toContain('BackendModule');
    expect(i18n).toContain('resources,');
  });
});
