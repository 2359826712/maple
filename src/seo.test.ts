import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getSitemapEntries } from '@/next/routeData';

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
    const routeHead = read('src/next/RouteHead.tsx');
    const robots = read('src/pages/robots.txt.next.tsx');
    const sitemap = read('src/pages/sitemap.xml.next.tsx');

    expect(`${routeHead}${robots}${sitemap}`).not.toContain('example.com');
    expect(routeHead).toContain('canonicalUrl');
    expect(routeHead).toContain('<link rel="canonical" href={canonicalUrl}');
    expect(robots).toContain('Sitemap: https://mpstorys.com/sitemap.xml');
    expect(sitemap).toContain('`${SITE_URL}${pathname}`');
  });

  it('blocks private routes while leaving public utility pages crawlable', () => {
    const robots = read('src/pages/robots.txt.next.tsx');

    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /account');
    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Disallow: /auth/login');
    expect(robots).toContain('Disallow: /api/');
    expect(robots).not.toContain('Disallow: /search');
    expect(robots).not.toContain('Disallow: /source');
  });

  it('adds defense-in-depth noindex headers for private routes', () => {
    const routeHead = read('src/next/RouteHead.tsx');

    expect(routeHead).toContain("const index = Boolean(entry?.index)");
    expect(routeHead).toContain("entry?.follow !== false");
    expect(routeHead).toContain('<meta name="robots" content={robots} />');
    expect(routeHead).toContain('<meta name="googlebot" content={robots} />');
  });

  it('exposes complete Next.js metadata and sitemap hints', () => {
    const routeHead = read('src/next/RouteHead.tsx');
    const document = read('src/pages/_document.next.tsx');
    const sitemap = read('src/pages/sitemap.xml.next.tsx');

    expect(routeHead).toContain('meta name="keywords"');
    expect(document).toContain('rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48"');
    expect(document).toContain('rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png"');
    expect(document).toContain('rel="icon" type="image/jpeg" sizes="128x128" href="/mpstorys-icon-128.jpg"');
    expect(document).toContain('rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"');
    expect(document).toContain('rel="manifest" href="/site.webmanifest"');
    expect(routeHead).toContain('meta property="og:image"');
    expect(routeHead).toContain('application/ld+json');
    expect(routeHead).toContain('const keywords = seriesProduct');
    expect(routeHead).toContain('keywords,');
    expect(sitemap).toContain('<changefreq>');
    expect(sitemap).toContain('<priority>');
  });

  it('includes every supported MapleStory series in localized search metadata', () => {
    const keywords = JSON.parse(read('src/seo/siteKeywords.json')) as Record<string, string>;
    const series = [
      'MapleStory Classic',
      'MapleStory M',
      'MapleStory Worlds',
      'MapleStory N',
      'MapleStory Idle',
    ];
    Object.values(keywords).forEach((value) => {
      series.forEach((name) => expect(value).toContain(name));
    });
    series.forEach((name) => expect(metadataCatalog.routes['/'].copy.en.description).toContain(name));
    expect(metadataCatalog.routes['/news'].copy.en.description).toContain('MapleStory Idle');
  });

  it('gives each scoped series page distinct metadata and canonical URLs', () => {
    const routeHead = read('src/next/RouteHead.tsx');
    const scopedRoute = read('src/pages/series/SeriesModuleRoute.tsx');

    expect(routeHead).toContain('seriesPageTitle');
    expect(routeHead).toContain('translation[seriesProduct.descriptionKey]');
    expect(routeHead).toContain('?series=${encodeURIComponent(seriesProduct.id)}');
    expect(routeHead).toContain('${canonicalSeriesSearch}`');
    expect(scopedRoute).toContain('{product.name} {moduleLabel}');
    expect(scopedRoute).toContain("t('series_scoped_module_desc'");
  });

  it('keeps private and duplicate-prone utility pages out of the sitemap', () => {
    const paths = getSitemapEntries().map(({ pathname }) => pathname);

    expect(paths.some((path) => /\/(?:account|auth\/login|search|source|wiki\/redirect)\//.test(path))).toBe(false);
  });

  it('publishes only real series and edition combinations in the sitemap', () => {
    const seriesPaths = getSitemapEntries()
      .map(({ pathname }) => pathname)
      .filter((pathname) => /^\/series\/maplestory-/.test(pathname));

    expect(seriesPaths).toHaveLength(75);
    expect(seriesPaths).toContain('/series/maplestory-pc/en/KMS');
    expect(seriesPaths).toContain('/series/maplestory-m/zh-hant/TMS');
    expect(seriesPaths).toContain('/series/maplestory-worlds/ko/KMS');
    expect(seriesPaths).not.toContain('/series/maplestory-classic/en/KMS');
    expect(seriesPaths).not.toContain('/series/maplestory-idle/ja/JMS');
  });

  it('ships a large social preview card with accessible metadata', () => {
    const index = read('index.html');

    expect(index).toContain('<meta name="twitter:card" content="summary_large_image"');
    expect(index).toContain('<meta property="og:image" content="https://mpstorys.com/og.png"');
    expect(index).toContain('<meta property="og:image:alt"');
    expect(existsSync(new URL('../public/og.png', import.meta.url))).toBe(true);
  });

  it('server-renders the React application before hydration', () => {
    const application = read('src/next/NextApplication.tsx');
    const hydrationRouter = read('src/next/HydrationSafeRouter.tsx');
    const routePage = read('src/next/NextRoutePage.tsx');

    expect(application).toContain('data-server-rendered-route={page.pathname}');
    expect(application).toContain('<HydrationSafeRouter initialLocation={page.requestPath || page.pathname}>');
    expect(hydrationRouter).toContain('<Router');
    expect(hydrationRouter).toContain("static={typeof window === 'undefined'}");
    expect(routePage).toContain('<NextApplication {...props} initialRouteElement={initialRouteElement} />');
  });

  it('serves the bare root as the canonical default homepage', () => {
    const routeData = read('src/next/routeData.ts');
    const serverRoute = read('src/next/serverRoute.ts');

    expect(routeData).toContain("const isDefaultHomepage = normalized === '/'");
    expect(routeData).toContain('return localizedUrl === requestPath ? null : localizedUrl');
    expect(serverRoute).toContain('permanent: true');
  });

  it('gives homepage content images meaningful alternative text', () => {
    const highlights = read('src/pages/home/components/CurrentVersionHighlights.tsx');
    const rankings = read('src/pages/home/components/RankingBoard.tsx');

    expect(highlights).toContain('alt={card.title}');
    expect(rankings).toContain('alt={`${rank.characterName} MapleStory character`}');
    expect(highlights).not.toMatch(/<img[\s\S]*?alt=""[\s\S]*?\/>/);
    expect(rankings).not.toMatch(/<img[\s\S]*?alt=""[\s\S]*?\/>/);
  });

  it('defines unique localized metadata for every static route', () => {
    const expectedRoutes = [
      '/', '/account', '/admin/feedback', '/auth/login', '/checklist', '/community', '/events', '/feedback', '/guides',
      '/guides/level', '/mapler-house', '/maps', '/news', '/rankings', '/rankings/classes',
      '/search', '/series', '/source', '/tools', '/upcoming', '/wiki', '/wiki/boss', '/wiki/redirect',
      '/shop',
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
    const sitemapPaths = getSitemapEntries().map(({ pathname }) => pathname);
    Object.entries(metadataCatalog.routes)
      .filter(([, route]) => !route.index)
      .forEach(([route]) => expect(sitemapPaths.some((pathname) => pathname.startsWith(`${route}/`))).toBe(false));
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

  it('builds every application route with request-time SSR', () => {
    const packageJson = JSON.parse(read('package.json')) as { scripts: { build: string } };
    const nextConfig = read('next.config.mjs');
    const catchAll = read('src/pages/[[...route]].next.tsx');
    const serverRoute = read('src/next/serverRoute.ts');
    const dockerfile = read('Dockerfile');

    expect(packageJson.scripts.build).toBe('next build --webpack');
    expect(nextConfig).toContain("output: 'standalone'");
    expect(catchAll).toContain('getServerSideProps: GetServerSideProps<NextRoutePageProps>');
    expect(catchAll).toContain('getServerSideRouteProps(context)');
    expect(catchAll).not.toContain('getStaticProps');
    expect(catchAll).not.toContain('getStaticPaths');
    expect(serverRoute).toContain('GetServerSideProps');
    expect(serverRoute).toContain("s-maxage=43200");
    expect(dockerfile).toContain('/app/.next/standalone');
    expect(dockerfile).toContain('CMD ["node", "server.js"]');
  });
});
