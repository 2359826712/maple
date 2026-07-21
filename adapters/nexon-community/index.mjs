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

const contentTypeLabel = (contentType) => ({
  'creator-announcement': 'creator announcement',
  'developer-note': 'developer note',
  event: 'event notice',
  guide: 'guide',
  maintenance: 'maintenance notice',
  news: 'news item',
  'patch-note': 'patch note',
}[contentType] || contentType.replaceAll('-', ' '));

const responsePayload = (body, mode) => {
  const parsed = JSON.parse(body);
  return mode === 'worlds' ? parsed.data : parsed;
};

const requestHeaders = (config) => ({
  accept: 'application/json',
  ...(config.headers || {}),
});

const paginationConfig = (config) => ({
  strategy: config.pagination?.strategy,
  start: config.pagination?.start ?? 1,
  pageSize: config.pagination?.page_size ?? config.page_size ?? 25,
  blockSize: config.pagination?.block_size ?? config.block_size ?? config.page_size ?? 25,
  paginationType: config.pagination?.pagination_type || 'PAGING',
  searchKeywordType: config.pagination?.search_keyword_type || config.search_keyword_type || null,
  headlineId: config.pagination?.headline_id || null,
});

const listEndpoint = (config, page) => {
  const pagination = paginationConfig(config);
  const endpoint = new URL(
    config.mode === 'worlds'
      ? `https://community.invalid/api/v1/board/${config.board_id}/threads`
      : `https://community.invalid/board/${config.board_id}/threadsV2`,
  );
  endpoint.searchParams.set('paginationType', pagination.paginationType);
  endpoint.searchParams.set('pageNo', String(page?.index ?? pagination.start));
  endpoint.searchParams.set('pageSize', String(pagination.pageSize));
  endpoint.searchParams.set('blockSize', String(pagination.blockSize));
  if (pagination.searchKeywordType) endpoint.searchParams.set('searchKeywordType', pagination.searchKeywordType);
  if (pagination.headlineId) endpoint.searchParams.set('headlineId', String(pagination.headlineId));
  if (page?.blockStartKey?.length) endpoint.searchParams.set('blockStartKey', page.blockStartKey.join(','));
  if (page?.blockStartNo != null) endpoint.searchParams.set('blockStartNo', String(page.blockStartNo));
  // Nexon's proxy expects its comma-delimited keyset exactly as emitted by the
  // official clients; an encoded comma is treated as a different parameter.
  return `${endpoint.pathname}${endpoint.search}`.replace(/%2C/gi, ',');
};

const listItems = (payload, source) => {
  const config = source.adapter_config;
  if (!Array.isArray(payload?.threads)) throw new Error('Nexon community listing did not return threads');
  const records = [
    ...(Array.isArray(payload?.stickyThreads) ? payload.stickyThreads : []),
    ...payload.threads,
  ];
  const unique = new Map();
  for (const record of records) {
    const externalId = String(record.threadId || '');
    if (!externalId || unique.has(externalId)) continue;
    const contentType = classify(config, record);
    unique.set(externalId, {
      url: config.canonical_template.replace('{threadId}', externalId),
      externalId,
      title: decodeHtml(record.title),
      publishedAt: epochIso(record.createDate),
      metadata: {
        content_type: contentType,
        headline_id: String(record.headlineId || ''),
        is_sticky: Boolean(record.isSticky),
        listing_record: record,
      },
    });
  }
  return [...unique.values()];
};

const nonStickyItems = (items) => items.filter((item) => !item.metadata?.is_sticky);

const verifyListingOrder = (items, page) => {
  const ordered = nonStickyItems(items).filter((item) => item.publishedAt);
  for (let index = 1; index < ordered.length; index += 1) {
    if (ordered[index].publishedAt > ordered[index - 1].publishedAt) {
      throw new Error('Nexon community listing is not in descending publication order');
    }
  }
  if (page?.previousLastPublishedAt && ordered[0]?.publishedAt > page.previousLastPublishedAt) {
    throw new Error('Nexon community listing order changed across a page boundary');
  }
};

const fetchListingPage = async (source, context, page, { conditional = false } = {}) => {
  const config = source.adapter_config;
  const endpoint = listEndpoint(config, page);
  if (config.mode === 'worlds') {
    const result = await context.fetch(source.api_url, {
      conditional,
      method: 'POST',
      headers: { 'content-type': 'application/json', ...requestHeaders(config) },
      body: JSON.stringify({ methodType: 'GET', endPoint: endpoint, type: config.community_type }),
    });
    const requestUrls = [`POST ${source.api_url} ${endpoint}`];
    if (result.status < 400 && page.index === paginationConfig(config).start && config.pagination?.include_sticky) {
      const stickyEndpoint = `/api/v1/board/${config.board_id}/stickyThreads?pageSize=${config.pagination.sticky_page_size || 5}`;
      const sticky = await context.fetch(source.api_url, {
        conditional,
        method: 'POST',
        headers: { 'content-type': 'application/json', ...requestHeaders(config) },
        body: JSON.stringify({ methodType: 'GET', endPoint: stickyEndpoint, type: config.community_type }),
      });
      if (sticky.status >= 400) throw new Error(`Nexon community sticky listing returned HTTP ${sticky.status}`);
      const mainDocument = result.status === 304 ? { code: 0, message: 'not-modified', data: { threads: [] } } : JSON.parse(result.body);
      const stickyDocument = sticky.status === 304 ? { data: { stickyThreads: [] } } : JSON.parse(sticky.body);
      mainDocument.data = {
        ...(mainDocument.data || {}),
        stickyThreads: stickyDocument.data?.stickyThreads || [],
      };
      result.body = JSON.stringify(mainDocument);
      if (result.status === 304 && sticky.status !== 304) result.status = sticky.status;
      requestUrls.push(`POST ${source.api_url} ${stickyEndpoint}`);
    }
    return {
      ...result,
      requestUrls,
      logicalEndpoint: endpoint,
    };
  }
  const endpointUrl = new URL(`${source.api_url}${endpoint}`);
  const result = await context.fetch(endpointUrl.href, {
    conditional,
    headers: requestHeaders(config),
  });
  return { ...result, requestUrls: [endpointUrl.href], logicalEndpoint: endpoint };
};

const decodeHtml = (value) => (
  parseDocument(`<html><body><span>${String(value || '')}</span></body></html>`, 'text/html')
    .querySelector('span')?.textContent?.trim() || String(value || '')
);

const matchesConfiguredRule = (rule, record) => {
  const values = {
    title: decodeHtml(record.title),
    summary: decodeHtml(record.summary),
    body: textFromHtml(record.content),
  };
  if (rule.headline_ids && !rule.headline_ids.map(String).includes(String(record.headlineId || ''))) return false;
  for (const [field, pattern] of Object.entries({
    title: rule.title_pattern,
    summary: rule.summary_pattern,
    body: rule.body_pattern,
  })) {
    if (pattern && !new RegExp(pattern, 'i').test(values[field])) return false;
  }
  const combined = `${values.title} ${values.summary} ${values.body}`;
  return !rule.exclude_pattern || !new RegExp(rule.exclude_pattern, 'i').test(combined);
};

const configuredClassification = (config, record, overrideHeadline) => config.classification_rules
  ?.find((rule) => Boolean(rule.override_headline) === overrideHeadline && matchesConfiguredRule(rule, record))
  ?.content_type;

const classify = (config, record) => {
  const title = decodeHtml(record.title).toLowerCase();
  const headline = String(record.headlineId || '');
  const overridingType = configuredClassification(config, record, true);
  if (overridingType) return overridingType;
  const configuredHeadlineType = config.headline_type_map?.[headline];
  if (configuredHeadlineType) return configuredHeadlineType;
  const configuredRuleType = configuredClassification(config, record, false);
  if (configuredRuleType) return configuredRuleType;
  const issueOrFollowUp = /compensation|event (?:error|issue)|issue regarding|abuse of|sanction|discontinuation|usage limitation/.test(title);
  if (!issueOrFollowUp && (/maintenance|hotfix/.test(title) || headline === '5040' || ['3477', '3478'].includes(headline))) return 'maintenance';
  if (/known issues?|patch notes?|update notes?/.test(title) || headline === '5041') return 'patch-note';
  if (!issueOrFollowUp && /(\bevent\b|challenge|campaign)/.test(title)) return 'event';
  return config.default_content_type || (config.mode === 'worlds' ? 'creator-announcement' : 'news');
};

const configuredSubcategory = (config, contentType, record) => config.subcategory_rules
  ?.find((rule) => (!rule.content_types || rule.content_types.includes(contentType)) && matchesConfiguredRule(rule, record))
  ?.subcategory;

const subtype = (config, contentType, headline, record) => {
  const configured = configuredSubcategory(config, contentType, record)
    || config.content_type_subcategory_map?.[contentType];
  if (configured) return configured;
  if (contentType === 'creator-announcement') return 'creator-notice';
  if (contentType === 'developer-note') return 'developer-note';
  if (contentType === 'guide') return 'guide';
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

const monthNumber = (value) => {
  const normalized = String(value || '').toLowerCase().replace('.', '');
  if (monthIndex.has(normalized)) return monthIndex.get(normalized);
  return [...monthIndex.entries()].find(([month]) => month.startsWith(normalized))?.[1] ?? null;
};

const inferredRangeYears = (publishedAt, startMonth, endMonth) => {
  let startYear = new Date(publishedAt).getUTCFullYear();
  if (startMonth < new Date(publishedAt).getUTCMonth() - 6) startYear += 1;
  return { startYear, endYear: endMonth < startMonth ? startYear + 1 : startYear };
};

const dateOnly = (year, month, day) => (
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
);

const eventDates = (text, publishedAt) => {
  const match = text.match(/UTC:\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+at\s+(\d{1,2}):(\d{2})\s+until\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+at\s+(\d{1,2}):(\d{2})/i);
  if (!publishedAt) return null;
  if (match) {
    const startMonth = monthNumber(match[1]);
    const endMonth = monthNumber(match[5]);
    const { startYear, endYear } = inferredRangeYears(publishedAt, startMonth, endMonth);
    return {
      eventStart: new Date(Date.UTC(startYear, startMonth, Number(match[2]), Number(match[3]), Number(match[4]))).toISOString(),
      eventEnd: new Date(Date.UTC(endYear, endMonth, Number(match[6]), Number(match[7]), Number(match[8]))).toISOString(),
      timezone: 'UTC',
    };
  }

  const submissionMatch = text.match(/submissions?\s+open\s+([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?[\s\S]{0,160}?submissions?\s+close\s+([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+at\s+\d{1,2}:\d{2}\s*(?:AM|PM)\s+Pacific Time)?/i);
  if (submissionMatch) {
    const startMonth = monthNumber(submissionMatch[1]);
    const endMonth = monthNumber(submissionMatch[3]);
    if (startMonth !== null && endMonth !== null) {
      const { startYear, endYear } = inferredRangeYears(publishedAt, startMonth, endMonth);
      return {
        eventStart: dateOnly(startYear, startMonth, Number(submissionMatch[2])),
        eventEnd: dateOnly(endYear, endMonth, Number(submissionMatch[4])),
        timezone: /Pacific Time/i.test(submissionMatch[0]) ? 'America/Los_Angeles' : null,
      };
    }
  }

  const rangeMatch = text.match(/\bfrom\s+([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\s+(?:through|until|to)\s+([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?/i);
  if (!rangeMatch) return null;
  const startMonth = monthNumber(rangeMatch[1]);
  const endMonth = monthNumber(rangeMatch[3]);
  if (startMonth === null || endMonth === null) return null;
  const { startYear, endYear } = inferredRangeYears(publishedAt, startMonth, endMonth);
  return {
    eventStart: dateOnly(startYear, startMonth, Number(rangeMatch[2])),
    eventEnd: dateOnly(endYear, endMonth, Number(rangeMatch[4])),
    timezone: /\b(?:PT|Pacific Time)\b/i.test(text)
      ? 'America/Los_Angeles'
      : /\b(?:UTC|GMT)\b/i.test(text) ? 'UTC' : null,
  };
};

const normalizedTagDate = (value) => {
  const text = String(value || '').trim().replaceAll('/', '-');
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const timestamp = Date.parse(text);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

const openEndedTagDate = (value) => /^9999(?:[-/]|$)/.test(String(value || '').trim());

const eventDatesFromTags = (record) => {
  const tags = Array.isArray(record.tags) ? record.tags : [];
  const eventStart = normalizedTagDate(tags[0]);
  const openEnded = openEndedTagDate(tags[1]);
  const eventEnd = openEnded ? null : normalizedTagDate(tags[1]);
  if (!eventStart && !eventEnd && !openEnded) return null;
  return { eventStart, eventEnd, timezone: 'UTC', openEnded };
};

const claimDates = (text) => {
  const match = text.match(/(?:reward\s+)?claim(?:ing)?\s+(?:period|deadline)?[^\d]{0,40}(\d{4}[-/]\d{2}[-/]\d{2}(?:T[^\s<]+)?)\s*(?:~|until|through|to)\s*(\d{4}[-/]\d{2}[-/]\d{2}(?:T[^\s<]+)?)/i);
  if (!match) return null;
  return { claimStart: normalizedTagDate(match[1]), claimEnd: normalizedTagDate(match[2]) };
};

const structuredEventOccurrences = (body) => {
  const document = parseDocument(`<html><body>${body || ''}</body></html>`, 'text/html');
  return [...document.querySelectorAll('[data-event-occurrence]')].map((node) => {
    const key = node.getAttribute('data-event-occurrence')?.trim();
    const title = node.querySelector('h1,h2,h3,h4')?.textContent?.replace(/\s+/g, ' ').trim() || null;
    const value = (name) => normalizedTagDate(node.querySelector(`[data-${name}]`)?.getAttribute('datetime'));
    const eventStart = value('event-start');
    const eventEnd = value('event-end');
    if (!key || !eventStart || !eventEnd) return null;
    return {
      key,
      title,
      dates: {
        eventStart,
        eventEnd,
        claimStart: value('claim-start'),
        claimEnd: value('claim-end'),
        shopStart: value('shop-start'),
        shopEnd: value('shop-end'),
        timezone: 'UTC',
      },
    };
  }).filter(Boolean);
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

const originalSummary = (source, title, contentType, publishedAt) => {
  const date = publishedAt ? ` on ${publishedAt.slice(0, 10)}` : '';
  return `“${title}” is an official ${contentTypeLabel(contentType)} from ${source.name}${date}. `
    + 'Its canonical Nexon thread and publication metadata are retained for source-backed verification.';
};

export const nexonCommunityAdapter = {
  async discover(source, context) {
    const config = source.adapter_config;
    const mode = config.mode;
    const result = await fetchListingPage(source, context, { index: paginationConfig(config).start }, {
      conditional: mode === 'worlds',
    });
    if (result.status === 304) return [];
    if (result.status >= 400) throw new Error(`Nexon community listing returned HTTP ${result.status}`);
    const payload = responsePayload(result.body, mode);
    return listItems(payload, source);
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
    const listingRecord = item.metadata.listing_record || {};
    const contentType = classify(config, { ...listingRecord, ...record });
    const publishedAt = epochIso(record.createDate) || item.publishedAt;
    const sourceText = textFromHtml(record.content);
    const tagDateEvidence = contentType === 'event' ? eventDatesFromTags(record.tags?.length ? record : listingRecord) : null;
    const tagDates = tagDateEvidence ? {
      eventStart: tagDateEvidence.eventStart,
      eventEnd: tagDateEvidence.eventEnd,
      timezone: tagDateEvidence.timezone,
    } : null;
    const eventOpenEnded = Boolean(tagDateEvidence?.openEnded);
    const textDates = contentType === 'event' ? eventDates(sourceText, publishedAt) : null;
    const confirmedClaimDates = contentType === 'event' ? claimDates(sourceText) : null;
    const baseDates = tagDates || textDates;
    const dates = baseDates ? { ...baseDates, ...confirmedClaimDates } : null;
    const occurrences = contentType === 'event' ? structuredEventOccurrences(record.content) : [];
    const warnings = [];
    if (!record.content) warnings.push('article-body-not-extractable');
    if (!publishedAt) warnings.push('publication-date-missing');
    if (contentType === 'event' && !dates && occurrences.length === 0) warnings.push('event-dates-not-confirmed');
    const updatedAt = epochIso(record.threadModifyDate);
    const subcategory = subtype(config, contentType, item.metadata.headline_id, record);
    const detailItems = [
      `Published by ${record.user?.nickname || context.source.name} on ${publishedAt?.slice(0, 10) || 'an unconfirmed date'}.`,
      `Official classification: ${subcategory.replaceAll('-', ' ')}.`,
      `Nexon thread ID: ${item.externalId}.`,
    ];
    if (eventOpenEnded) {
      detailItems.push(`Confirmed event start: ${dates.eventStart} (${dates.timezone}); the official source marks the end as open ended.`);
    } else if (dates) {
      const timezone = dates.timezone ? ` (${dates.timezone})` : '';
      detailItems.push(`Confirmed event period: ${dates.eventStart} through ${dates.eventEnd}${timezone}.`);
    }
    const makeParsed = (occurrence = null) => ({
      canonicalUrl: item.url,
      sourceUrl: item.url,
      externalId: occurrence ? `${item.externalId}:${occurrence.key}` : item.externalId,
      title: occurrence?.title || decodeHtml(record.title || item.title),
      originalTitle: decodeHtml(record.title || item.title),
      summary: originalSummary(
        context.source,
        decodeHtml(record.title || item.title),
        contentType,
        publishedAt,
      ),
      author: record.user?.nickname || null,
      publishedAt,
      updatedAt: updatedAt && updatedAt !== publishedAt ? updatedAt : null,
      contentType,
      subcategory,
      tags: [contentType, subcategory],
      images: imagesFrom(record, item.url),
      eventDates: occurrence?.dates || dates,
      metadata: {
        api_record: true,
        board_id: String(record.boardId || listingRecord.boardId || config.board_id),
        body_extractable: Boolean(record.content),
        event_date_evidence: occurrence ? 'official-body-structured-occurrence' : tagDates ? 'official-listing-tags' : textDates ? 'official-body-text' : null,
        event_open_ended: occurrence ? false : eventOpenEnded,
        event_occurrence_key: occurrence?.key || null,
        fetched_at: result.fetchedAt,
        headline_id: item.metadata.headline_id,
        official_category: config.headline_label_map?.[item.metadata.headline_id] || null,
        official_tags: record.tags || listingRecord.tags || [],
        original_timezone: null,
        source_time_format: 'unix-epoch-seconds',
        parser_warnings: warnings,
        unconfirmed_fields: [
          ...(!updatedAt ? ['updated_at'] : []),
          ...(contentType === 'event' && !(occurrence?.dates || dates) ? ['event_start', 'event_end', 'timezone'] : []),
        ],
        sections: [{ title: 'Official publication record', items: detailItems }],
      },
    });
    return occurrences.length > 1 ? occurrences.map(makeParsed) : [makeParsed()];
  },

  async normalize(content, source, context) {
    return normalizeParsedContent(content, source, context);
  },

  async discoverPages(source) {
    const pagination = paginationConfig(source.adapter_config);
    if (pagination.strategy !== 'nexon-keyset') return { supported: false };
    return {
      supported: true,
      firstPage: {
        index: pagination.start,
        cursor: null,
        blockStartKey: null,
        blockStartNo: null,
        previousLastPublishedAt: null,
      },
      totalPages: null,
    };
  },

  async fetchPage(page, source, context) {
    return fetchListingPage(source, context, page, { conditional: false });
  },

  async discoverItems(result, page, source) {
    if (result.status >= 400) return [];
    const payload = responsePayload(result.body, source.adapter_config.mode);
    const items = listItems(payload, source);
    verifyListingOrder(items, page);
    return items;
  },

  async discoverNextPage(page, result, items, source) {
    if (!result || result.status >= 400) return { page: null, reason: 'next-page-missing' };
    if (items.length === 0) return { page: null, reason: 'empty-page' };
    const payload = responsePayload(result.body, source.adapter_config.mode);
    const pagination = paginationConfig(source.adapter_config);
    const totalPages = Number(payload?.totalPages);
    const knownTotalPages = Number.isInteger(totalPages) && totalPages >= 0 ? totalPages : null;
    if (knownTotalPages !== null && page.index >= knownTotalPages) {
      return { page: null, reason: 'last-page', totalPages: knownTotalPages };
    }
    const numberOfElements = Number(payload?.numberOfElements);
    const pageItemCount = Number.isInteger(numberOfElements) && numberOfElements >= 0
      ? numberOfElements
      : nonStickyItems(items).length;
    if (pageItemCount < pagination.pageSize) {
      return { page: null, reason: 'last-page', totalPages: knownTotalPages };
    }
    const blockStartKey = Array.isArray(payload?.blockStartKey)
      ? payload.blockStartKey.map(String).filter(Boolean)
      : [];
    if (blockStartKey.length === 0) {
      return { page: null, reason: 'next-page-missing', totalPages: knownTotalPages };
    }
    const ordered = nonStickyItems(items).filter((item) => item.publishedAt);
    return {
      page: {
        index: page.index + 1,
        cursor: blockStartKey.join(','),
        blockStartKey,
        blockStartNo: payload.blockStartNo ?? page.blockStartNo ?? 1,
        previousLastPublishedAt: ordered.at(-1)?.publishedAt || page.previousLastPublishedAt || null,
      },
      totalPages: knownTotalPages,
    };
  },
};
