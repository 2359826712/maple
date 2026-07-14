import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('static application loading', () => {
  it('code-splits route pages and provides a Suspense fallback', () => {
    const router = source('router/config.tsx');
    const routerRoot = source('router/index.ts');
    expect(router.match(/\blazy\s*\(/g)?.length).toBeGreaterThan(10);
    expect(router).toMatch(/\bimport\s*\(/);
    expect(routerRoot).toContain('Suspense');
  });

  it('bundles every locale without an asynchronous locale backend', () => {
    const i18n = source('i18n/index.ts');
    expect(i18n).not.toMatch(/\bimport\s*\(/);
    expect(i18n).not.toContain('BackendModule');
    expect(i18n).toContain('resources,');
  });
});
