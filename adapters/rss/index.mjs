import { absoluteUrl, attachItem, normalizeParsedContent, parseDocument, parseHtmlPage, text } from '../lib.mjs';

function childText(node, names) {
  for (const name of names) {
    const value = text(node.getElementsByTagName(name)[0]);
    if (value) return value;
  }
  return null;
}

export const rssAdapter = {
  async discover(source, context) {
    const result = await context.fetch(source.feed_url || source.discovery_urls[0]);
    if (result.status === 304) return [];
    if (result.status >= 400) throw new Error(`Feed returned HTTP ${result.status}`);
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
