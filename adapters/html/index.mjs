import { absoluteUrl, attachItem, normalizeParsedContent, parseDocument, parseHtmlPage, text } from '../lib.mjs';

function matchesAny(value, patterns = []) {
  return patterns.length === 0 || patterns.some((pattern) => new RegExp(pattern, 'i').test(value));
}

function itemsFromPage(result, source) {
  const items = [];
  const selector = source.adapter_config.link_selector || 'a[href]';
  const document = parseDocument(result.body, 'text/html');
  for (const link of document.querySelectorAll(selector)) {
    const url = absoluteUrl(link.getAttribute('href'), result.finalUrl);
    if (!url || !matchesAny(url, source.adapter_config.include_patterns || [])) continue;
    if ((source.adapter_config.exclude_patterns || []).some((pattern) => new RegExp(pattern, 'i').test(url))) continue;
    items.push({
      url,
      externalId: link.getAttribute('data-id') || null,
      title: text(source.adapter_config.title_selector ? link.querySelector(source.adapter_config.title_selector) : link),
      publishedAt: link.querySelector('time[datetime]')?.getAttribute('datetime') || null,
      metadata: { discovery_url: result.finalUrl },
    });
  }
  return [...new Map(items.map((item) => [item.url, item])).values()];
}

function numberedPage(source, index, value) {
  const config = source.adapter_config.pagination;
  const url = new URL(source.discovery_urls[0]);
  url.searchParams.set(config.param || config.strategy, String(value));
  return { index, value, url: url.href };
}

export const htmlAdapter = {
  async discover(source, context) {
    const items = [];
    for (const discoveryUrl of source.discovery_urls) {
      const result = await context.fetch(discoveryUrl);
      if (result.status === 304) continue;
      if (result.status >= 400) throw new Error(`Discovery page returned HTTP ${result.status}`);
      items.push(...itemsFromPage(result, source));
    }
    return [...new Map(items.map((item) => [item.url, item])).values()];
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
    if (!config) return { supported: false };
    if (['page', 'offset'].includes(config.strategy)) {
      const start = config.start ?? (config.strategy === 'page' ? 1 : 0);
      return { supported: true, firstPage: numberedPage(source, 1, start), totalPages: config.total_pages ?? null };
    }
    if (config.strategy === 'next-url') {
      return { supported: true, firstPage: { index: 1, url: source.discovery_urls[0] }, totalPages: null };
    }
    return { supported: false };
  },
  async fetchPage(page, source, context) {
    return context.fetch(page.url, { conditional: false });
  },
  async discoverItems(result, page, source) {
    return itemsFromPage(result, source);
  },
  async discoverNextPage(page, result, items, source) {
    if (!result || result.status >= 400) {
      const config = source.adapter_config.pagination;
      if (!['page', 'offset'].includes(config.strategy)) return { page: null, reason: 'next-page-missing' };
      const step = config.step || config.page_size || 1;
      return { page: numberedPage(source, page.index + 1, page.value + step) };
    }
    const config = source.adapter_config.pagination;
    if (config.strategy === 'next-url') {
      const document = parseDocument(result.body, 'text/html');
      const next = absoluteUrl(document.querySelector(config.next_selector || 'a[rel="next"]')?.getAttribute('href'), result.finalUrl);
      return next ? { page: { index: page.index + 1, url: next } } : { page: null, reason: 'next-page-missing' };
    }
    if (items.length === 0) return { page: null, reason: 'empty-page' };
    if (config.page_size && items.length < config.page_size) return { page: null, reason: 'last-page' };
    const step = config.strategy === 'offset' ? (config.step || config.page_size || items.length) : 1;
    return { page: numberedPage(source, page.index + 1, page.value + step), totalPages: config.total_pages ?? null };
  },
};
