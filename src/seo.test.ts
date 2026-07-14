import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('search and social metadata', () => {
  const metadataCatalog = JSON.parse(read('src/seo/routeMetadata.json')) as {
    languages: Record<string, unknown>;
    routes: Record<string, {
      copy: Record<string, { description: string; title: string }>;
      index: boolean;
    }>;
  };

  it('uses the production domain consistently', () => {
    const index = read('index.html');
    const robots = read('public/robots.txt');
    const sitemap = read('public/sitemap.xml');

    expect(`${index}${robots}${sitemap}`).not.toContain('example.com');
    expect(index).toContain('<link rel="canonical" href="https://mpstorys.com/"');
    expect(robots).toContain('Sitemap: https://mpstorys.com/sitemap.xml');
    expect(sitemap).toContain('<loc>https://mpstorys.com/</loc>');
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
      '/', '/account', '/auth/login', '/checklist', '/community', '/events', '/guides',
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
});
