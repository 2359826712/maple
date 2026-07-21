import { attachItem, normalizeParsedContent, parseHtmlPage } from '../lib.mjs';

export function atPath(value, path = '') {
  return path.split('.').filter(Boolean).reduce((current, key) => current?.[key], value);
}

function recordsFromPayload(payload, config) {
  const records = atPath(payload, config.items_path) || payload;
  if (!Array.isArray(records)) throw new Error('JSON API adapter expected an array at adapter_config.items_path');
  return records;
}

function itemsFromPayload(payload, result, source) {
  const config = source.adapter_config;
  return recordsFromPayload(payload, config).map((record) => ({
    url: new URL(atPath(record, config.url_field || 'url'), result.finalUrl).href,
    externalId: String(atPath(record, config.id_field || 'id') ?? '') || null,
    title: atPath(record, config.title_field || 'title') || null,
    publishedAt: atPath(record, config.published_field || 'published_at') || null,
    metadata: { api_url: result.finalUrl },
  }));
}

function apiPage(source, index, value, urlValue = null) {
  const config = source.adapter_config.pagination;
  const url = new URL(urlValue || source.api_url || source.discovery_urls[0]);
  const parameter = config.param || (config.strategy === 'next-token' ? 'token' : config.strategy);
  if (!urlValue && value != null) url.searchParams.set(parameter, String(value));
  return { index, value, cursor: ['cursor', 'before', 'after'].includes(config.strategy) ? value : null, url: url.href };
}

export const jsonApiAdapter = {
  async discover(source, context) {
    const config = source.adapter_config;
    const endpoint = new URL(source.api_url || source.discovery_urls[0]);
    if (context.cursor && config.cursor_param) endpoint.searchParams.set(config.cursor_param, context.cursor);
    const result = await context.fetch(endpoint.href);
    if (result.status === 304) return [];
    if (result.status >= 400) throw new Error(`JSON API returned HTTP ${result.status}`);
    const payload = JSON.parse(result.body);
    const records = recordsFromPayload(payload, config);
    if (config.next_cursor_path && context.setCursor) {
      context.setCursor(atPath(payload, config.next_cursor_path) ?? null);
    }
    return itemsFromPayload(payload, result, source);
  },
  async fetch(item, context) {
    return attachItem(await context.fetch(item.url), item);
  },
  async parse(result) {
    if (result.contentType?.includes('json')) {
      const payload = JSON.parse(result.body);
      return [{
        canonicalUrl: result.finalUrl,
        sourceUrl: result.finalUrl,
        externalId: result.discoveredItem?.externalId || null,
        title: result.discoveredItem?.title || payload.title || payload.name,
        originalTitle: payload.title || payload.name || result.discoveredItem?.title,
        summary: payload.summary || payload.description || null,
        author: payload.author?.name || payload.author || null,
        publishedAt: result.discoveredItem?.publishedAt || payload.published_at || payload.date || null,
        updatedAt: payload.updated_at || null,
        images: [],
        metadata: { api_record: true, fetched_at: result.fetchedAt },
      }];
    }
    return [parseHtmlPage(result)];
  },
  async normalize(content, source, context) {
    return normalizeParsedContent(content, source, context);
  },
  async discoverPages(source) {
    const config = source.adapter_config.pagination;
    if (!config || !['page', 'offset', 'cursor', 'before', 'after', 'next-token', 'next-url'].includes(config.strategy)) {
      return { supported: false };
    }
    const start = config.start ?? (config.strategy === 'page' ? 1 : config.strategy === 'offset' ? 0 : null);
    return { supported: true, firstPage: apiPage(source, 1, start), totalPages: config.total_pages ?? null };
  },
  async fetchPage(page, source, context) {
    return context.fetch(page.url, { conditional: false });
  },
  async discoverItems(result, page, source) {
    return itemsFromPayload(JSON.parse(result.body), result, source);
  },
  async discoverNextPage(page, result, items, source) {
    const config = source.adapter_config.pagination;
    if (!result || result.status >= 400) {
      if (!['page', 'offset'].includes(config.strategy)) return { page: null, reason: 'next-page-missing' };
      const step = config.strategy === 'offset' ? (config.step || config.page_size || 1) : 1;
      return { page: apiPage(source, page.index + 1, page.value + step) };
    }
    const payload = JSON.parse(result.body);
    if (items.length === 0) return { page: null, reason: 'empty-page' };
    if (config.strategy === 'next-url') {
      const nextUrl = atPath(payload, config.next_url_path || 'next');
      return nextUrl ? { page: apiPage(source, page.index + 1, null, new URL(nextUrl, result.finalUrl).href) } : { page: null, reason: 'next-page-missing' };
    }
    if (['cursor', 'before', 'after', 'next-token'].includes(config.strategy)) {
      const token = atPath(payload, config.next_token_path || config.next_cursor_path || 'next_cursor');
      return token != null && token !== ''
        ? { page: apiPage(source, page.index + 1, token) }
        : { page: null, reason: 'next-page-missing' };
    }
    if (config.page_size && items.length < config.page_size) return { page: null, reason: 'last-page' };
    const step = config.strategy === 'offset' ? (config.step || config.page_size || items.length) : 1;
    return { page: apiPage(source, page.index + 1, page.value + step), totalPages: config.total_pages ?? null };
  },
};
