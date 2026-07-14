import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('search and social metadata', () => {
  const metadataCatalog = JSON.parse(read('src/seo/routeMetadata.json')) as {
    languages: Record<string, unknown>;
    routes: Record<string, {
      copy: Record<string, { description: string; title: string }>;
      index: boolean;
      schema?: { types: string[] };
    }>;
  };

  it('uses the production domain consistently', () => {
    const index = read('index.html');
    const robots = read('public/robots.txt');
    const sitemap = read('public/sitemap.xml');

    expect(`${index}${robots}${sitemap}`).not.toContain('example.com');
    expect(index).toContain('<link rel="canonical" href="https://mpstorys.com/"');
    expect(robots).toContain('Sitemap: https://mpstorys.com/sitemap.xml');
    expect(sitemap).toContain('<loc>https://mpstorys.com/en/GMS</loc>');
  });

  it('blocks private routes while leaving public utility pages crawlable', () => {
    const robots = read('public/robots.txt');

    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /account');
    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Disallow: /auth/login');
    expect(robots).toContain('Disallow: /api/');
    expect(robots).not.toContain('Disallow: /search');
    expect(robots).not.toContain('Disallow: /source');
  });

  it('adds defense-in-depth noindex headers for private routes', () => {
    const headers = read('public/_headers');

    expect(headers).toMatch(/\/account\*\r?\n\s+X-Robots-Tag: noindex, nofollow/);
    expect(headers).toMatch(/\/admin\/\*\r?\n\s+X-Robots-Tag: noindex, nofollow/);
    expect(headers).toMatch(/\/auth\/login\*\r?\n\s+X-Robots-Tag: noindex, nofollow/);
  });

  it('keeps ignored sitemap hints out while exposing Readdy website fields', () => {
    const index = read('index.html');
    const sitemap = read('public/sitemap.xml');

    expect(index).toContain('meta name="keywords"');
    expect(index).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg"');
    expect(index).toContain('<link rel="shortcut icon" type="image/svg+xml" href="/favicon.svg"');
    expect(index).toContain('meta property="og:image:secure_url"');
    expect(index).toContain('link rel="image_src"');
    expect(sitemap).not.toContain('<changefreq>');
    expect(sitemap).not.toContain('<priority>');
  });

  it('keeps private and duplicate-prone utility pages out of the sitemap', () => {
    const sitemap = read('public/sitemap.xml');

    expect(sitemap).not.toMatch(/<loc>[^<]+\/(?:account|auth\/login|search|source|wiki\/redirect)<\/loc>/);
  });

  it('ships a large social preview card with accessible metadata', () => {
    const index = read('index.html');

    expect(index).toContain('<meta name="twitter:card" content="summary_large_image"');
    expect(index).toContain('<meta property="og:image" content="https://mpstorys.com/og.png"');
    expect(index).toContain('<meta property="og:image:alt"');
    expect(existsSync(new URL('../public/og.png', import.meta.url))).toBe(true);
  });

  it('defines unique localized metadata for every static route', () => {
    const expectedRoutes = [
      '/', '/account', '/admin/feedback', '/auth/login', '/checklist', '/community', '/events', '/feedback', '/guides',
      '/guides/level', '/mapler-house', '/maps', '/news', '/rankings', '/rankings/classes',
      '/search', '/source', '/tools', '/upcoming', '/wiki', '/wiki/boss', '/wiki/redirect',
    ];
    const languages = Object.keys(metadataCatalog.languages);

    expect(Object.keys(metadataCatalog.routes).sort()).toEqual(expectedRoutes.sort());
    Object.values(metadataCatalog.routes).forEach((route) => {
      expect(Object.keys(route.copy).sort()).toEqual([...languages].sort());
      Object.values(route.copy).forEach(({ description, title }) => {
        expect(title.trim().length).toBeGreaterThan(5);
        expect(description.trim().length).toBeGreaterThan(20);
        expect(description.length).toBeLessThanOrEqual(180);
      });
    });
  });

  it('keeps every noindex catalog route out of the source sitemap', () => {
    const sitemap = read('public/sitemap.xml');
    Object.entries(metadataCatalog.routes)
      .filter(([, route]) => !route.index)
      .forEach(([route]) => expect(sitemap).not.toContain(`<loc>https://mpstorys.com${route}`));
  });

  it('defines structured data for every indexable static route', () => {
    Object.entries(metadataCatalog.routes).forEach(([route, metadata]) => {
      if (metadata.index) {
        expect(metadata.schema?.types, route).toContain('WebPage');
      } else {
        expect(metadata.schema, route).toBeUndefined();
      }
    });

    expect(metadataCatalog.routes['/'].schema?.types).toContain('WebSite');
  });

  it('runs route-aware SEO generation in every Vite production build', () => {
    const packageJson = JSON.parse(read('package.json')) as { scripts: { build: string } };
    const viteConfig = read('vite.config.ts');
    const readdySync = read('readdy-sync.mjs');

    expect(packageJson.scripts.build).toBe('vite build');
    expect(viteConfig).toContain('name: "route-seo-output"');
    expect(viteConfig).toContain('await generateLocalizedStaticRoutes()');
    expect(viteConfig).toContain('await verifySeoOutput()');
    expect(readdySync).toContain("'scripts/generate-localized-static-routes.mjs'");
    expect(readdySync).toContain("'scripts/verify-seo-output.mjs'");
  });
});
