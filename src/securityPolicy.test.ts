import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PreviewServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

const scriptDirective = (policy: string) =>
  policy.split(';').map((directive) => directive.trim()).find((directive) => directive.startsWith('script-src')) || '';

describe('deployable browser security policy', () => {
  it.each(['vite.config.ts', 'public/_headers'])('%s restricts scripts to self without unsafe-inline/eval', (path) => {
    const source = read(path);
    const directive = scriptDirective(source.match(/default-src[^"\r\n]+/)?.[0] || source);
    expect(directive).toContain("script-src 'self'");
    expect(directive).not.toContain("'unsafe-inline'");
    expect(directive).not.toContain("'unsafe-eval'");
  });

  it('contains no inline bootstrap script', () => {
    const html = read('index.html');
    const scripts = [...html.matchAll(/<script\b([^>]*)>/gi)];
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.every((match) => /\bsrc\s*=/.test(match[1]))).toBe(true);
  });

  it('contains no remote code evaluation or generic CORS proxy fallback', () => {
    const source = read('src/services/liveContent.ts');
    expect(source).not.toMatch(/\b(?:eval|Function)\s*\(/);
    expect(source).not.toMatch(/allorigins|corsproxy|cloudflare\s*bypass/i);
  });
});

describe('Vite preview server security headers', () => {
  let server: PreviewServer;
  let baseUrl: string;

  beforeAll(async () => {
    const { preview } = await import('vite');
    server = await preview({ root, preview: { port: 0 } });
    const address = server.httpServer?.address();
    const port = typeof address === 'object' && address ? address.port : 4173;
    baseUrl = `http://127.0.0.1:${port}`;
  }, 30_000);

  afterAll(async () => {
    await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
  });

  it('serves Content-Security-Policy with script-src self and no unsafe-inline/eval', async () => {
    const response = await fetch(baseUrl);
    const csp = response.headers.get('content-security-policy') ?? '';
    expect(csp).toContain("script-src 'self'");
    const scriptDir = scriptDirective(csp);
    expect(scriptDir).not.toContain("'unsafe-inline'");
    expect(scriptDir).not.toContain("'unsafe-eval'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('serves Referrer-Policy and X-Content-Type-Options', async () => {
    const response = await fetch(baseUrl);
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('production _headers file matches preview server CSP policy', () => {
    const configSource = read('vite.config.ts');
    const deployHeaders = read('public/_headers');

    // Both files must contain script-src 'self' (using scriptDirective for precise match)
    const configScriptDir = scriptDirective(configSource);
    const deployScriptDir = scriptDirective(deployHeaders);
    expect(configScriptDir).toContain("script-src 'self'");
    expect(deployScriptDir).toContain("script-src 'self'");

    // Both must enforce default-src 'self'
    expect(configSource).toContain("default-src 'self'");
    expect(deployHeaders).toContain("default-src 'self'");

    // Deploy CSP script-src must not contain unsafe-eval
    expect(deployScriptDir).not.toContain("'unsafe-eval'");

    // Both must include upgrade-insecure-requests
    expect(configSource).toContain('upgrade-insecure-requests');
    expect(deployHeaders).toContain('upgrade-insecure-requests');

    // Deploy headers must include nosniff and referrer-policy
    expect(deployHeaders).toContain('nosniff');
    expect(deployHeaders).toContain('strict-origin-when-cross-origin');
  });
});
