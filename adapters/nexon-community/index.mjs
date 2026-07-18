import {
  absoluteUrl,
  attachItem,
  normalizeParsedContent,
  parseDocument,
} from '../lib.mjs';

const epochIso = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? new Date(number * 1000).toISOString() : null;
};

const responsePayload = (body, mode) => {
  const parsed = JSON.parse(body);
  return mode === 'worlds' ? parsed.data : parsed;
};

const requestHeaders = (config) => ({
  accept: 'application/json',
  ...(config.headers || {}),
});

const classify = (mode, record) => {
  const title = String(record.title || '').toLowerCase();
  const headline = String(record.headlineId || '');
  if (/maintenance|hotfix/.test(title) || headline === '5040' || ['3477', '3478'].includes(headline)) return 'maintenance';
  if (/known issues?|patch notes?|update notes?/.test(title) || headline === '5041') return 'patch-note';
  if (/\bevent\b|challenge|campaign/.test(title) || ['5042', '3479', '3480', '3481', '5287'].includes(headline)) return 'event';
  return mode === 'worlds' ? 'creator-announcement' : 'news';
};

const subtype = (contentType, headline) => {
  if (contentType === 'creator-announcement') return 'creator-notice';
  if (contentType === 'patch-note') return 'known-issues';
  if (contentType === 'maintenance') return 'maintenance';
  if (contentType === 'event') return 'event';
  return headline === '5132' ? 'notice' : 'announcement';
};

const textFromHtml = (body) => (
  parseDocument(`<html><body>${body || ''}</body></html>`, 'text/html').body?.textContent?.replace(/\s+/g, ' ').trim() || ''
);

const monthIndex = new Map([
  ['january', 0], ['february', 1], ['march', 2], ['april', 3], ['may', 4], ['june', 5],
  ['july', 6], ['august', 7], ['september', 8], ['october', 9], ['november', 10], ['december', 11],
]);

const eventDates = (text, publishedAt) => {
  const match = text.match(/UTC:\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+at\s+(\d{1,2}):(\d{2})\s+until\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+at\s+(\d{1,2}):(\d{2})/i);
  if (!match || !publishedAt) return null;
  const startMonth = monthIndex.get(match[1].toLowerCase());
  const endMonth = monthIndex.get(match[5].toLowerCase());
  let startYear = new Date(publishedAt).getUTCFullYear();
  if (startMonth < new Date(publishedAt).getUTCMonth() - 6) startYear += 1;
  const endYear = endMonth < startMonth ? startYear + 1 : startYear;
  return {
    eventStart: new Date(Date.UTC(startYear, startMonth, Number(match[2]), Number(match[3]), Number(match[4]))).toISOString(),
    eventEnd: new Date(Date.UTC(endYear, endMonth, Number(match[6]), Number(match[7]), Number(match[8]))).toISOString(),
    timezone: 'UTC',
  };
};

const imagesFrom = (record, sourceUrl) => {
  const values = [];
  const document = parseDocument(`<html><body>${record.content || ''}</body></html>`, 'text/html');
  for (const image of document.querySelectorAll('img[src]')) {
    const url = absoluteUrl(image.getAttribute('src'), sourceUrl);
    if (url) values.push({ url, alt: image.getAttribute('alt')?.trim() || null });
  }
  if (record.thumbnailImageUrl && !/forum_NEXON\.jpg/i.test(record.thumbnailImageUrl)) {
    values.unshift({ url: record.thumbnailImageUrl, alt: record.title || null });
  }
  return [...new Map(values.map((image) => [image.url, image])).values()];
};

const originalSummary = (source, title, contentType) => (
  `${source.name} published this ${contentType.replaceAll('-', ' ')} about “${title}”. `
  + 'MPStorys records the verified timing, classification, and canonical first-party source.'
);

export const nexonCommunityAdapter = {
  async discover(source, context) {
    const config = source.adapter_config;
    const mode = config.mode;
    let result;
    if (mode === 'worlds') {
      result = await context.fetch(source.api_url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...requestHeaders(config) },
        body: JSON.stringify({
          methodType: 'GET',
          endPoint: `/api/v1/board/${config.board_id}/threads?paginationType=PAGING&pageNo=1&pageSize=${config.page_size || 25}&blockSize=${config.page_size || 25}`,
          type: config.community_type,
        }),
      });
    } else {
      const endpoint = new URL(`${source.api_url}/board/${config.board_id}/threadsV2`);
      endpoint.searchParams.set('paginationType', 'PAGING');
      endpoint.searchParams.set('pageNo', '1');
      endpoint.searchParams.set('pageSize', String(config.page_size || 25));
      endpoint.searchParams.set('blockSize', String(config.block_size || 9));
      endpoint.searchParams.set('searchKeywordType', 'THREAD_TITLE_AND_CONTENT');
      result = await context.fetch(endpoint.href, { headers: requestHeaders(config) });
    }
    if (result.status === 304) return [];
    if (result.status >= 400) throw new Error(`Nexon community listing returned HTTP ${result.status}`);
    const payload = responsePayload(result.body, mode);
    const threads = payload?.threads || [];
    if (!Array.isArray(threads)) throw new Error('Nexon community listing did not return threads');

    return threads.map((record) => {
      const contentType = classify(mode, record);
      return {
        url: config.canonical_template.replace('{threadId}', record.threadId),
        externalId: String(record.threadId),
        title: record.title,
        publishedAt: epochIso(record.createDate),
        metadata: {
          content_type: contentType,
          headline_id: String(record.headlineId || ''),
          listing_record: record,
        },
      };
    });
  },

  async fetch(item, context) {
    const config = context.source.adapter_config;
    let result;
    if (config.mode === 'worlds') {
      result = await context.fetch(context.source.api_url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...requestHeaders(config) },
        body: JSON.stringify({ methodType: 'GET', endPoint: `/api/v1/thread/${item.externalId}`, type: config.community_type }),
      });
    } else {
      result = await context.fetch(`${context.source.api_url}/thread/${item.externalId}`, { headers: requestHeaders(config) });
    }
    return attachItem(result, item);
  },

  async parse(result, context) {
    const config = context.source.adapter_config;
    const item = result.discoveredItem;
    const record = responsePayload(result.body, config.mode);
    const contentType = item.metadata.content_type;
    const publishedAt = epochIso(record.createDate) || item.publishedAt;
    const sourceText = textFromHtml(record.content);
    const dates = contentType === 'event' ? eventDates(sourceText, publishedAt) : null;
    const warnings = [];
    if (!record.content) warnings.push('article-body-not-extractable');
    if (!publishedAt) warnings.push('publication-date-missing');
    if (contentType === 'event' && !dates) warnings.push('event-dates-not-confirmed');
    const updatedAt = epochIso(record.threadModifyDate);
    const detailItems = [
      `Published by ${record.user?.nickname || context.source.name} on ${publishedAt?.slice(0, 10) || 'an unconfirmed date'}.`,
      `Official classification: ${subtype(contentType, item.metadata.headline_id).replaceAll('-', ' ')}.`,
      `Nexon thread ID: ${item.externalId}.`,
    ];
    if (dates) detailItems.push(`Confirmed event period: ${dates.eventStart} through ${dates.eventEnd} (${dates.timezone}).`);
    return [{
      canonicalUrl: item.url,
      sourceUrl: item.url,
      externalId: item.externalId,
      title: record.title || item.title,
      originalTitle: record.title || item.title,
      summary: originalSummary(context.source, record.title || item.title, contentType),
      author: record.user?.nickname || null,
      publishedAt,
      updatedAt: updatedAt && updatedAt !== publishedAt ? updatedAt : null,
      contentType,
      subcategory: subtype(contentType, item.metadata.headline_id),
      tags: [contentType, subtype(contentType, item.metadata.headline_id)],
      images: imagesFrom(record, item.url),
      eventDates: dates,
      metadata: {
        api_record: true,
        body_extractable: Boolean(record.content),
        fetched_at: result.fetchedAt,
        headline_id: item.metadata.headline_id,
        parser_warnings: warnings,
        unconfirmed_fields: [
          ...(!updatedAt ? ['updated_at'] : []),
          ...(contentType === 'event' && !dates ? ['event_start', 'event_end', 'timezone'] : []),
        ],
        sections: [{ title: 'Official publication record', items: detailItems }],
      },
    }];
  },

  async normalize(content, source, context) {
    return normalizeParsedContent(content, source, context);
  },
};
