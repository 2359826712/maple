import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDirectory = new URL('../out/', import.meta.url);
const outputPath = fileURLToPath(outputDirectory);
const indexFile = new URL('index.html', outputDirectory);
const catalog = JSON.parse(await readFile(new URL('../src/seo/routeMetadata.json', import.meta.url), 'utf8'));
const baseHtml = await readFile(indexFile, 'utf8');
const languages = Object.keys(catalog.languages);
const routes = Object.entries(catalog.routes);
const siteUrl = 'https://mpstorys.com';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const localizedPath = (route, language) => {
  const baseRoute = route === '/' ? '' : route.replace(/\/+$/, '');
  return `${baseRoute}/${catalog.languages[language].segment}` || '/';
};

const absoluteUrl = (pathname) => `${siteUrl}${pathname}`;

const setMeta = (html, attribute, key, content) => {
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*\\/?>`, 'i');
  const replacement = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
  if (!pattern.test(html)) throw new Error(`Missing ${attribute} metadata: ${key}`);
  return html.replace(pattern, replacement);
};

const renderPage = ({ entry, language, localized, route }) => {
  const languageConfig = catalog.languages[language];
  const copy = entry.copy[language] || entry.copy.en;
  const fullTitle = copy.title.includes('MPStorys') ? copy.title : `${copy.title} · MPStorys`;
  const canonicalRoute = entry.canonicalRoute || route;
  const canonicalPath = localized
    ? localizedPath(canonicalRoute, language)
    : localizedPath(canonicalRoute, 'en');
  const canonicalUrl = absoluteUrl(canonicalPath);
  const isIndexable = localized && entry.index;
  const shouldFollow = localized ? entry.follow !== false : true;
  const robots = `${isIndexable ? 'index' : 'noindex'}, ${shouldFollow ? 'follow' : 'nofollow'}, max-image-preview:large`;

  let html = baseHtml.replace(/<html\s+lang="[^"]*">/i, `<html lang="${languageConfig.htmlLang}">`);
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`);
  html = setMeta(html, 'name', 'description', copy.description);
  html = setMeta(html, 'name', 'robots', robots);
  html = setMeta(html, 'name', 'googlebot', robots);
  html = setMeta(html, 'property', 'og:locale', languageConfig.ogLocale);
  html = setMeta(html, 'property', 'og:title', fullTitle);
  html = setMeta(html, 'property', 'og:description', copy.description);
  html = setMeta(html, 'property', 'og:url', canonicalUrl);
  html = setMeta(html, 'name', 'twitter:title', fullTitle);
  html = setMeta(html, 'name', 'twitter:description', copy.description);

  const canonicalPattern = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i;
  if (!canonicalPattern.test(html)) throw new Error('Missing canonical link');

  const alternateLinks = isIndexable
    ? languages.map((alternateLanguage) => {
      const config = catalog.languages[alternateLanguage];
      return `    <link rel="alternate" hreflang="${config.hreflang}" href="${absoluteUrl(localizedPath(route, alternateLanguage))}" />`;
    }).concat(`    <link rel="alternate" hreflang="x-default" href="${absoluteUrl(localizedPath(route, 'en'))}" />`)
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
  return html;
};

for (const [route, entry] of routes) {
  const routeDirectory = route === '/' ? outputPath : join(outputPath, route.slice(1));
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(
    join(routeDirectory, 'index.html'),
    renderPage({ entry, language: 'en', localized: false, route }),
    'utf8',
  );

  for (const language of languages) {
    const localizedDirectory = join(routeDirectory, catalog.languages[language].segment);
    await mkdir(localizedDirectory, { recursive: true });
    await writeFile(
      join(localizedDirectory, 'index.html'),
      renderPage({ entry, language, localized: true, route }),
      'utf8',
    );
  }
}

const sitemapUrls = routes
  .filter(([, entry]) => entry.index)
  .flatMap(([route]) => languages.map((language) => `  <url>\n    <loc>${absoluteUrl(localizedPath(route, language))}</loc>\n  </url>`));

await writeFile(
  new URL('sitemap.xml', outputDirectory),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>\n`,
  'utf8',
);

console.log(`Generated ${routes.length * (languages.length + 1)} route-aware SEO entry files and ${sitemapUrls.length} sitemap URLs.`);
