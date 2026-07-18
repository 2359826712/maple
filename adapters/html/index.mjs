import { absoluteUrl, attachItem, normalizeParsedContent, parseDocument, parseHtmlPage, text } from '../lib.mjs';

function matchesAny(value, patterns = []) {
  return patterns.length === 0 || patterns.some((pattern) => new RegExp(pattern, 'i').test(value));
}

export const htmlAdapter = {
  async discover(source, context) {
    const items = [];
    const selector = source.adapter_config.link_selector || 'a[href]';
    for (const discoveryUrl of source.discovery_urls) {
      const result = await context.fetch(discoveryUrl);
      if (result.status === 304) continue;
      if (result.status >= 400) throw new Error(`Discovery page returned HTTP ${result.status}`);
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
};
