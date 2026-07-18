import { absoluteUrl, attachItem, normalizeParsedContent, parseDocument, parseHtmlPage, text } from '../lib.mjs';

export const sitemapAdapter = {
  async discover(source, context) {
    const items = [];
    for (const sitemapUrl of source.sitemap_urls.length ? source.sitemap_urls : source.discovery_urls) {
      const result = await context.fetch(sitemapUrl);
      if (result.status === 304) continue;
      if (result.status >= 400) throw new Error(`Sitemap returned HTTP ${result.status}`);
      const document = parseDocument(result.body, 'text/xml');
      for (const node of document.getElementsByTagName('url')) {
        const url = absoluteUrl(text(node.getElementsByTagName('loc')[0]), result.finalUrl);
        if (url) items.push({
          url,
          externalId: null,
          title: null,
          publishedAt: text(node.getElementsByTagName('lastmod')[0]),
          metadata: { sitemap_url: result.finalUrl, sitemap_lastmod: text(node.getElementsByTagName('lastmod')[0]) },
        });
      }
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
};
