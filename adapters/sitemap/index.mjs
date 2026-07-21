import { absoluteUrl, attachItem, normalizeParsedContent, parseDocument, parseHtmlPage, text } from '../lib.mjs';

function sitemapItems(result) {
  const document = parseDocument(result.body, 'text/xml');
  return [...document.getElementsByTagName('url')].map((node) => {
    const url = absoluteUrl(text(node.getElementsByTagName('loc')[0]), result.finalUrl);
    return url ? {
      url,
      externalId: null,
      title: null,
      publishedAt: text(node.getElementsByTagName('lastmod')[0]),
      metadata: { sitemap_url: result.finalUrl, sitemap_lastmod: text(node.getElementsByTagName('lastmod')[0]) },
    } : null;
  }).filter(Boolean);
}

export const sitemapAdapter = {
  async discover(source, context) {
    const items = [];
    for (const sitemapUrl of source.sitemap_urls.length ? source.sitemap_urls : source.discovery_urls) {
      const result = await context.fetch(sitemapUrl);
      if (result.status === 304) continue;
      if (result.status >= 400) throw new Error(`Sitemap returned HTTP ${result.status}`);
      items.push(...sitemapItems(result));
    }
    return items;
  },
  async fetch(item, context) {
    return attachItem(await context.fetch(item.url), item);
  },
  async parse(result) {
    return [parseHtmlPage(result)];
  },
  async normalize(content, source, context) {
    return normalizeParsedContent(content, source, context);
  },
  async discoverPages(source) {
    const urls = source.sitemap_urls.length ? source.sitemap_urls : source.discovery_urls;
    if (urls.length === 0) return { supported: false };
    return {
      supported: true,
      firstPage: { index: 1, url: urls[0], remainingUrls: urls.slice(1) },
      totalPages: urls.length > 1 ? urls.length : null,
    };
  },
  async fetchPage(page, source, context) {
    return context.fetch(page.url, { conditional: false });
  },
  async discoverItems(result) {
    return sitemapItems(result);
  },
  async discoverNextPage(page, result) {
    if (!result || result.status >= 400) {
      const [url, ...remainingUrls] = page.remainingUrls || [];
      return url ? { page: { index: page.index + 1, url, remainingUrls } } : { page: null, reason: 'next-page-missing' };
    }
    const document = parseDocument(result.body, 'text/xml');
    const indexedUrls = [...document.getElementsByTagName('sitemap')]
      .map((node) => absoluteUrl(text(node.getElementsByTagName('loc')[0]), result.finalUrl))
      .filter(Boolean);
    const queue = indexedUrls.length ? [...indexedUrls, ...(page.remainingUrls || [])] : (page.remainingUrls || []);
    const [url, ...remainingUrls] = queue;
    return url
      ? { page: { index: page.index + 1, url, remainingUrls }, totalPages: page.index + queue.length }
      : { page: null, reason: 'last-page' };
  },
};
