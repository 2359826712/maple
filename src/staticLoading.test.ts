import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('static application loading', () => {
  it('code-splits route pages and provides a Suspense fallback', () => {
    const router = source('router/config.tsx');
    const routerRoot = source('router/index.ts');
    const routePreloader = source('components/base/RoutePreloader.tsx');
    expect(router.match(/\blazyWithPreload\s*\(/g)?.length).toBeGreaterThan(10);
    expect(router).toMatch(/\bimport\s*\(/);
    expect(router).toContain('prefetchRouteForPath');
    expect(routePreloader).toContain('prefetchPathResources');
    expect(routePreloader).not.toContain('IntersectionObserver');
    expect(routePreloader).not.toContain('requestIdleCallback');
    expect(routerRoot).toContain('Suspense');
  });

  it('keeps large search and series indexes out of the initial homepage bundle', () => {
    const navbar = source('pages/home/components/Navbar.tsx');
    const routeFactory = source('router/routeFactory.tsx');
    const routeHead = source('next/RouteHead.tsx');
    const catchAllRoute = source('pages/[[...route]].next.tsx');

    expect(navbar).toContain("import('@/services/siteSearch')");
    expect(navbar).not.toMatch(/^import .*services\/siteSearch/m);
    expect(routeFactory).not.toMatch(/^import SeriesModuleRoute/m);
    expect(routeHead).not.toContain("@/pages/series/verifiedContent");
    expect(routeHead).not.toContain("@/mocks/bosses");
    expect(catchAllRoute).toContain('initialDetail={props.initialSeriesResourceDetail}');
    expect(source('pages/series/SeriesResourceDetailPage.tsx')).toContain("import('./verifiedContent')");
  });

  it('loads only the active locale before hydrating the app', () => {
    const i18n = source('i18n/index.ts');
    expect(i18n).toMatch(/\bimport\s*\(/);
    expect(i18n).toContain('ensureLanguageResources');
    expect(i18n).not.toContain('BackendModule');
    expect(i18n).toContain('resources,');
  });

  it('bundles the icon font locally instead of relying on a blocked CDN loader', () => {
    const main = source('main.tsx');
    const html = source('../index.html');
    expect(main).toContain("import 'remixicon/fonts/remixicon.css'");
    expect(html).not.toContain('cdnjs.cloudflare.com/ajax/libs/remixicon');
    expect(html).not.toContain('onload=');
  });

  it('uses a Next-compatible PostCSS config so Tailwind utilities are compiled', () => {
    const postcss = source('../postcss.config.mjs');
    const nextApp = source('pages/_app.next.tsx');
    expect(postcss).toContain('tailwindcss: {}');
    expect(postcss).toContain('autoprefixer: {}');
    expect(nextApp).toContain("import '@/index.css'");
  });

  it('does not run the retired static-shell redirect from the analytics bootstrap', () => {
    const nextApp = source('pages/_app.next.tsx');
    const nextDocument = source('pages/_document.next.tsx');
    const analytics = source('../public/ga4-next.js');
    expect(nextApp).toContain('src="/ga4-next.js"');
    expect(nextApp).not.toContain('src="/ga4.js"');
    expect(nextDocument).toContain('name="mpstorys-build"');
    expect(analytics).not.toContain('location.replace');
    expect(analytics).not.toContain('__mpstorys_restore');
    expect(analytics).not.toContain('route-shell');
  });

  it('server-renders news content and its structured data before hydration', () => {
    const routeData = source('next/routeData.ts');
    const newsPage = source('pages/news/page.tsx');
    const routeHead = source('next/RouteHead.tsx');
    expect(routeData).toContain('fetchLiveNews(server)');
    expect(newsPage).toContain('baseItems: initialNews');
    expect(routeHead).toContain("'@type': 'ItemList'");
    expect(routeHead).toContain("'@type': 'NewsArticle'");
  });
});
