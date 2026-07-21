import { absoluteUrl, attachItem, normalizeParsedContent, parseDocument, parseHtmlPage, text } from '../lib.mjs';

function childText(node, names) {
  for (const name of names) {
    const value = text(node.getElementsByTagName(name)[0]);
    if (value) return value;
  }
  return null;
}

function itemsFromFeed(result) {
  const document = parseDocument(result.body, 'text/xml');
  const nodes = [...document.getElementsByTagName('item'), ...document.getElementsByTagName('entry')];
  return nodes.map((node) => {
    const linkNode = node.getElementsByTagName('link')[0];
    const rawLink = linkNode?.getAttribute('href') || text(linkNode);
    return {
      url: absoluteUrl(rawLink, result.finalUrl),
      externalId: childText(node, ['guid', 'id']),
      title: childText(node, ['title']),
      publishedAt: childText(node, ['pubDate', 'published', 'updated']),
      metadata: { feed_url: result.finalUrl },
    };
  }).filter((item) => item.url);
}

function feedPage(source, index, value, explicitUrl = null) {
  const config = source.adapter_config.pagination;
  const url = new URL(explicitUrl || source.feed_url || source.discovery_urls[0]);
  if (!explicitUrl && value != null) url.searchParams.set(config.param || config.strategy, String(value));
  return { index, value, cursor: ['before', 'after'].includes(config.strategy) ? value : null, url: url.href };
}

export const rssAdapter = {
  async discover(source, context) {
    const result = await context.fetch(source.feed_url || source.discovery_urls[0]);
    if (result.status === 304) return [];
    if (result.status >= 400) throw new Error(`Feed returned HTTP ${result.status}`);
    return itemsFromFeed(result);
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
    const config = source.adapter_config.pagination;
    if (!config || !['page', 'before', 'after', 'next-url'].includes(config.strategy)) return { supported: false };
    const start = config.start ?? (config.strategy === 'page' ? 1 : null);
    return { supported: true, firstPage: feedPage(source, 1, start), totalPages: config.total_pages ?? null };
  },
  async fetchPage(page, source, context) {
    return context.fetch(page.url, { conditional: false });
  },
  async discoverItems(result) {
    return itemsFromFeed(result);
  },
  async discoverNextPage(page, result, items, source) {
    const config = source.adapter_config.pagination;
    if (!result || result.status >= 400) return { page: null, reason: 'next-page-missing' };
    if (items.length === 0) return { page: null, reason: 'empty-page' };
    const document = parseDocument(result.body, 'text/xml');
    const nextLink = [...document.getElementsByTagName('link')]
      .find((link) => link.getAttribute('rel') === 'next')?.getAttribute('href');
    if (nextLink) return { page: feedPage(source, page.index + 1, null, absoluteUrl(nextLink, result.finalUrl)) };
    if (config.strategy === 'next-url') return { page: null, reason: 'next-page-missing' };
    if (config.page_size && items.length < config.page_size) return { page: null, reason: 'last-page' };
    if (config.strategy === 'page') return { page: feedPage(source, page.index + 1, page.value + 1), totalPages: config.total_pages ?? null };
    const token = childText(document, [config.next_token_element || `next-${config.strategy}`]);
    return token ? { page: feedPage(source, page.index + 1, token) } : { page: null, reason: 'next-page-missing' };
  },
};
