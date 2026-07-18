import { attachItem, normalizeParsedContent, parseHtmlPage } from '../lib.mjs';

function atPath(value, path = '') {
  return path.split('.').filter(Boolean).reduce((current, key) => current?.[key], value);
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
    const records = atPath(payload, config.items_path) || payload;
    if (!Array.isArray(records)) throw new Error('JSON API adapter expected an array at adapter_config.items_path');
    if (config.next_cursor_path && context.setCursor) {
      context.setCursor(atPath(payload, config.next_cursor_path) ?? null);
    }
    return records.map((record) => ({
      url: new URL(atPath(record, config.url_field || 'url'), result.finalUrl).href,
      externalId: String(atPath(record, config.id_field || 'id') ?? '') || null,
      title: atPath(record, config.title_field || 'title') || null,
      publishedAt: atPath(record, config.published_field || 'published_at') || null,
      metadata: { api_url: result.finalUrl },
    }));
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
};
