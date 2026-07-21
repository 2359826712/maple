import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function generateLocalizedStaticRoutes() {
const outputDirectory = new URL('../out/', import.meta.url);
const outputPath = fileURLToPath(outputDirectory);
const indexFile = new URL('index.html', outputDirectory);
const catalog = JSON.parse(await readFile(new URL('../src/seo/routeMetadata.json', import.meta.url), 'utf8'));
const siteKeywords = JSON.parse(await readFile(new URL('../src/seo/siteKeywords.json', import.meta.url), 'utf8'));
const baseHtml = await readFile(indexFile, 'utf8');
const { renderRoute } = await import(new URL('../.ssg/ssg-entry.js', import.meta.url));
const languages = Object.keys(catalog.languages);
const servers = ['GMS', 'KMS', 'JMS', 'TMS', 'MSEA'];
const routes = Object.entries(catalog.routes);
const siteUrl = 'https://mpstorys.com';
const organizationId = `${siteUrl}/#organization`;
const websiteId = `${siteUrl}/#website`;

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const buildPageTitle = (title) => {
  const suffix = ' · MPStorys';
  const hasSiteName = title.includes('MPStorys');
  const fullTitle = hasSiteName ? title : `${title}${suffix}`;
  if (fullTitle.length <= 60) return fullTitle;
  if (hasSiteName) return `${fullTitle.slice(0, 59).trimEnd()}…`;
  return `${title.slice(0, 60 - suffix.length - 1).trimEnd()}…${suffix}`;
};

const localizedPath = (route, language) => {
  const baseRoute = route === '/' ? '' : route.replace(/\/+$/, '');
  return `${baseRoute}/${catalog.languages[language].segment}` || '/';
};

const localizedServerPath = (route, language, server) => (
  route === '/' && language === 'en' && server === 'GMS'
    ? '/'
    : `${localizedPath(route, language)}/${server}`
);

const absoluteUrl = (pathname) => `${siteUrl}${pathname}`;

const setMeta = (html, attribute, key, content) => {
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*\\/?>`, 'i');
  const replacement = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
  if (!pattern.test(html)) throw new Error(`Missing ${attribute} metadata: ${key}`);
  return html.replace(pattern, replacement);
};

const schemaJson = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');

const organizationSchema = {
  '@type': 'Organization',
  '@id': organizationId,
  name: 'MPStorys',
  alternateName: 'MapleStory Player Hub',
  url: `${siteUrl}/`,
  logo: {
    '@type': 'ImageObject',
    contentUrl: `${siteUrl}/mpstorys-icon-128.jpg`,
    width: 128,
    height: 128,
  },
};

const websiteSchema = {
  '@type': 'WebSite',
  '@id': websiteId,
  name: 'MPStorys',
  alternateName: 'MapleStory Player Hub',
  url: `${siteUrl}/`,
  image: {
    '@type': 'ImageObject',
    contentUrl: `${siteUrl}/og.png`,
    width: 1731,
    height: 909,
  },
  publisher: { '@id': organizationId },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const breadcrumbSchema = (route, language, server) => {
  const routeSegments = route.split('/').filter(Boolean);
  const routeChain = [
    '/',
    ...routeSegments.map((_, index) => `/${routeSegments.slice(0, index + 1).join('/')}`),
  ].filter((candidate) => catalog.routes[candidate]?.index);

  return {
    '@type': 'BreadcrumbList',
    itemListElement: routeChain.map((candidate, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: (catalog.routes[candidate].copy[language] || catalog.routes[candidate].copy.en).title,
      item: absoluteUrl(localizedServerPath(candidate, language, server)),
    })),
  };
};

const renderPage = async ({ entry, language, localized, route, server }) => {
  const languageConfig = catalog.languages[language];
  const copy = entry.copy[language] || entry.copy.en;
  const fullTitle = buildPageTitle(copy.title);
  const canonicalRoute = entry.canonicalRoute || route;
  const canonicalPath = localized
    ? localizedServerPath(canonicalRoute, language, server || 'GMS')
    : localizedServerPath(canonicalRoute, 'en', 'GMS');
  const canonicalUrl = absoluteUrl(canonicalPath);
  const isIndexable = localized && Boolean(server) && entry.index;
  const shouldFollow = localized ? entry.follow !== false : true;
  const robots = `${isIndexable ? 'index' : 'noindex'}, ${shouldFollow ? 'follow' : 'nofollow'}, max-image-preview:large`;
  const renderPath = localized
    ? (server ? localizedServerPath(route, language, server) : localizedPath(route, language))
    : route;
  const renderedRoot = await renderRoute({
    language,
    pathname: renderPath,
    version: String(server || 'GMS').toLowerCase(),
  });

  let html = baseHtml.replace(/<html\s+lang="[^"]*">/i, `<html lang="${languageConfig.htmlLang}">`);
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`);
  html = setMeta(html, 'name', 'description', copy.description);
  html = setMeta(html, 'name', 'keywords', siteKeywords[language] || siteKeywords.en);
  html = setMeta(html, 'name', 'robots', robots);
  html = setMeta(html, 'name', 'googlebot', robots);
  html = setMeta(html, 'property', 'og:locale', languageConfig.ogLocale);
  html = setMeta(html, 'property', 'og:title', fullTitle);
  html = setMeta(html, 'property', 'og:description', copy.description);
  html = setMeta(html, 'property', 'og:url', canonicalUrl);
  html = setMeta(html, 'name', 'twitter:title', fullTitle);
  html = setMeta(html, 'name', 'twitter:description', copy.description);
  html = html.replace(
    /(<h1\b[^>]*data-seo-fallback-title[^>]*>)[\s\S]*?(<\/h1>)/i,
    `$1${escapeHtml(copy.title)}$2`,
  );
  html = html.replace(
    /(<p\b[^>]*data-seo-fallback-description[^>]*>)[\s\S]*?(<\/p>)/i,
    `$1\n          ${escapeHtml(copy.description)}\n        $2`,
  );

  const canonicalPattern = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i;
  if (!canonicalPattern.test(html)) throw new Error('Missing canonical link');

  const alternateLinks = isIndexable
    ? languages.map((alternateLanguage) => {
      const config = catalog.languages[alternateLanguage];
      return `    <link rel="alternate" hreflang="${config.hreflang}" href="${absoluteUrl(localizedServerPath(route, alternateLanguage, server))}" />`;
    }).concat(`    <link rel="alternate" hreflang="x-default" href="${absoluteUrl(localizedServerPath(route, 'en', server))}" />`)
    : [];

  const localeAlternates = isIndexable
    ? languages
      .filter((alternateLanguage) => alternateLanguage !== language)
      .map((alternateLanguage) => `    <meta property="og:locale:alternate" content="${catalog.languages[alternateLanguage].ogLocale}" />`)
    : [];

  html = html.replace(
    canonicalPattern,
    [`<link rel="canonical" href="${canonicalUrl}" />`, ...alternateLinks, ...localeAlternates].join('\n'),
  );

  if (isIndexable) {
    const schemaGraph = [organizationSchema, websiteSchema];
    if (entry.schema?.types.includes('WebPage')) {
      schemaGraph.push({
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        name: copy.title,
        description: copy.description,
        url: canonicalUrl,
        inLanguage: languageConfig.htmlLang,
        isPartOf: { '@id': websiteId },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          contentUrl: `${siteUrl}/og.png`,
          width: 1731,
          height: 909,
        },
      });
    }
    if (route !== '/') schemaGraph.push(breadcrumbSchema(route, language, server));

    html = html.replace(
      /<\/head>/i,
      `    <script type="application/ld+json" data-seo-schema="route">${schemaJson({ '@context': 'https://schema.org', '@graph': schemaGraph })}</script>\n  </head>`,
    );
  }

  const staticRootPattern = /(<div\s+id="root"[^>]*>)\s*<!--\s*static-seo-root-start\s*-->[\s\S]*?<!--\s*static-seo-root-end\s*-->\s*(<\/div>)/i;
  if (!staticRootPattern.test(html)) throw new Error('Missing static SEO root markers');
  html = html.replace(
    staticRootPattern,
    `<div id="root" data-ssg-route="${escapeHtml(renderPath)}">${renderedRoot}</div>`,
  );
  return html;
};

for (const [route, entry] of routes) {
  const routeDirectory = route === '/' ? outputPath : join(outputPath, route.slice(1));
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(
    join(routeDirectory, 'index.html'),
    await renderPage({ entry, language: 'en', localized: false, route }),
    'utf8',
  );

  for (const language of languages) {
    const localizedDirectory = join(routeDirectory, catalog.languages[language].segment);
    await mkdir(localizedDirectory, { recursive: true });
    await writeFile(
      join(localizedDirectory, 'index.html'),
      await renderPage({ entry, language, localized: true, route }),
      'utf8',
    );

    for (const server of servers) {
      const serverDirectory = join(localizedDirectory, server);
      await mkdir(serverDirectory, { recursive: true });
      await writeFile(
        join(serverDirectory, 'index.html'),
        await renderPage({ entry, language, localized: true, route, server }),
        'utf8',
      );
    }
  }
}

const sitemapUrls = routes
  .filter(([, entry]) => entry.index)
  .flatMap(([route]) => servers.flatMap((server) => languages.map((language) => {
    const alternateLinks = languages.map((alternateLanguage) => {
      const config = catalog.languages[alternateLanguage];
      return `    <xhtml:link rel="alternate" hreflang="${config.hreflang}" href="${absoluteUrl(localizedServerPath(route, alternateLanguage, server))}" />`;
    });
    alternateLinks.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(localizedServerPath(route, 'en', server))}" />`);
    return `  <url>\n    <loc>${absoluteUrl(localizedServerPath(route, language, server))}</loc>\n${alternateLinks.join('\n')}\n  </url>`;
  })));

await writeFile(
  new URL('sitemap.xml', outputDirectory),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemapUrls.join('\n')}\n</urlset>\n`,
  'utf8',
);

await writeFile(
  new URL('robots.txt', outputDirectory),
  [
    'User-agent: *',
    'Allow: /',
    'Disallow: /account',
    'Disallow: /admin/',
    'Disallow: /auth/login',
    'Disallow: /api/',
    'Sitemap: https://mpstorys.com/sitemap.xml',
    '',
  ].join('\n'),
  'utf8',
);

console.log(`Generated ${routes.length * (1 + languages.length + languages.length * servers.length)} route-aware SEO entry files and ${sitemapUrls.length} sitemap URLs.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateLocalizedStaticRoutes();
}
