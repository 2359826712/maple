import {
  absoluteUrl,
  attachItem,
  normalizeParsedContent,
  parseDocument,
} from '../lib.mjs';

const routeSlug = (value) => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const contentTypeFor = (record) => {
  const title = String(record.name || '').toLowerCase();
  const category = String(record.category || '').toLowerCase();
  if (/patch notes?|update notes?/.test(title)) return 'patch-note';
  if (category === 'sale' || /cash shop|sale/.test(title)) return 'cash-shop';
  if (category === 'events' || /\bevent\b/.test(title)) return 'event';
  if (category === 'maintenance' || /maintenance|known issues?/.test(title)) return 'maintenance';
  return 'news';
};

const originalSummary = (source, title, contentType) => (
  `${source.name} published this ${contentType.replaceAll('-', ' ')} about “${title}”. `
  + 'MPStorys preserves verified publication metadata and links the complete first-party announcement.'
);

const imagesFrom = (payload, result) => {
  const values = [];
  if (payload.imageThumbnail) values.push({ url: absoluteUrl(payload.imageThumbnail, 'https://g.nexonstatic.com/'), alt: payload.name || null });
  const document = parseDocument(`<html><body>${payload.body || ''}</body></html>`, 'text/html');
  for (const image of document.querySelectorAll('img[src]')) {
    const url = absoluteUrl(image.getAttribute('src'), result.discoveredItem?.url || result.finalUrl);
    if (url) values.push({ url, alt: image.getAttribute('alt')?.trim() || null });
  }
  return [...new Map(values.map((image) => [image.url, image])).values()];
};

export const nexonCmsAdapter = {
  async discover(source, context) {
    const result = await context.fetch(source.api_url || source.discovery_urls[0]);
    if (result.status === 304) return [];
    if (result.status >= 400) throw new Error(`Nexon CMS listing returned HTTP ${result.status}`);
    const payload = JSON.parse(result.body);
    if (!Array.isArray(payload)) throw new Error('Nexon CMS listing did not return an array');

    return payload.filter((record) => {
      const isClassic = Boolean(record.isMSCW) || /classic world/i.test(record.name || '');
      return source.series === 'classic' ? isClassic : !isClassic;
    }).map((record) => {
      const category = routeSlug(record.category || 'general') || 'general';
      const slug = routeSlug(record.name);
      return {
        url: `https://www.nexon.com/maplestory/news/${category}/${record.id}/${slug}`,
        externalId: String(record.id),
        title: record.name,
        publishedAt: record.liveDate || null,
        metadata: {
          api_detail_url: `${source.api_url || 'https://g.nexonstatic.com/maplestory/cms/v1/news'}/${record.id}`,
          category,
          content_type: contentTypeFor(record),
          image_thumbnail: record.imageThumbnail || null,
        },
      };
    });
  },

  async fetch(item, context) {
    return attachItem(await context.fetch(item.metadata.api_detail_url), item);
  },

  async parse(result, context) {
    const payload = JSON.parse(result.body);
    const item = result.discoveredItem;
    const contentType = item.metadata.content_type;
    const warnings = [];
    if (!payload.body) warnings.push('article-body-not-extractable');
    if (!payload.liveDate && !item.publishedAt) warnings.push('publication-date-missing');
    return [{
      canonicalUrl: item.url,
      sourceUrl: item.url,
      externalId: item.externalId,
      title: payload.name || item.title,
      originalTitle: payload.name || item.title,
      summary: originalSummary(context.source, payload.name || item.title, contentType),
      author: 'Global MapleStory',
      publishedAt: payload.liveDate || item.publishedAt,
      updatedAt: null,
      contentType,
      subcategory: item.metadata.category,
      tags: [item.metadata.category, contentType],
      images: imagesFrom(payload, result),
      metadata: {
        api_record: true,
        body_extractable: Boolean(payload.body),
        fetched_at: result.fetchedAt,
        parser_warnings: warnings,
        source_category: item.metadata.category,
        unconfirmed_fields: ['updated_at'],
        sections: [{
          title: 'Official publication record',
          items: [
            `Published by Global MapleStory on ${(payload.liveDate || item.publishedAt).slice(0, 10)}.`,
            `Official category: ${item.metadata.category.replaceAll('-', ' ')}.`,
            `Nexon article ID: ${item.externalId}.`,
          ],
        }],
      },
    }];
  },

  async normalize(content, source, context) {
    return normalizeParsedContent(content, source, context);
  },
};
