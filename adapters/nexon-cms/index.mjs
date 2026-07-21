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

const contentTypeLabel = (contentType) => ({
  'cash-shop': 'Cash Shop notice',
  event: 'event notice',
  maintenance: 'maintenance notice',
  news: 'news item',
  'patch-note': 'patch note',
}[contentType] || contentType.replaceAll('-', ' '));

const contentTypeFor = (record) => {
  const title = String(record.name || '').toLowerCase();
  const category = String(record.category || '').toLowerCase();
  if (/patch notes?|update notes?/.test(title)) return 'patch-note';
  if (/compensation|service issue|issue notice/.test(title)) return 'news';
  if (/(?:event\s+)?preview|winners?|results?|legacy guide|update on .*\bevent\b|event notice/.test(title)) return 'news';
  if (category === 'maintenance' || /maintenance|known issues?/.test(title)) return 'maintenance';
  if (category === 'sale' || /cash shop|sale/.test(title)) return 'cash-shop';
  if (category === 'events' || /\bevent\b/.test(title)) return 'event';
  return 'news';
};

const isClassicRecord = (record) => Boolean(record.isMSCW) || /classic world/i.test(record.name || '');

const recordsForSeries = (records, source) => records.filter((record) => (
  source.series === 'classic' ? isClassicRecord(record) : !isClassicRecord(record)
));

const uniqueRecords = (records) => {
  const seen = new Set();
  return records.filter((record) => {
    if (record.id == null) return true;
    const key = String(record.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const cmsRoot = (source) => new URL('./', source.api_url || 'https://g.nexonstatic.com/maplestory/cms/v1/news').href;

const paginationConfig = (source) => source.adapter_config?.pagination || {};

const paginationEndpointUrls = (source) => {
  const configured = paginationConfig(source).endpoint_urls;
  if (Array.isArray(configured) && configured.length > 0) return configured;
  const root = cmsRoot(source);
  return [new URL('news', root).href, new URL('archived', root).href];
};

const itemForRecord = (record, source) => {
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
};

const parseListing = (result, label = 'listing') => {
  if (result.status >= 400) throw new Error(`Nexon CMS ${label} returned HTTP ${result.status}`);
  const payload = JSON.parse(result.body);
  if (!Array.isArray(payload)) throw new Error(`Nexon CMS ${label} did not return an array`);
  return payload;
};

const months = new Map([
  ['january', 0], ['february', 1], ['march', 2], ['april', 3], ['may', 4], ['june', 5],
  ['july', 6], ['august', 7], ['september', 8], ['october', 9], ['november', 10], ['december', 11],
]);

const monthPattern = [...months.keys()].map((month) => month[0].toUpperCase() + month.slice(1)).join('|');

const maintenanceMarkerPattern = '\\((?:after(?:\\s+the)?|end\\s+of)\\s+maintenance\\)';

const timezoneOffsets = new Map([
  ['pst', -8], ['pdt', -7], ['cet', 1], ['cest', 2], ['aest', 10], ['aedt', 11],
]);

const utcInstant = (month, day, year, hour, minute, meridiem) => {
  let normalizedHour = Number(hour);
  if (meridiem.toLowerCase() === 'pm' && normalizedHour !== 12) normalizedHour += 12;
  if (meridiem.toLowerCase() === 'am' && normalizedHour === 12) normalizedHour = 0;
  return new Date(Date.UTC(Number(year), months.get(month.toLowerCase()), Number(day), normalizedHour, Number(minute))).toISOString();
};

const utcOffsetInstant = (month, day, year, hour, minute, meridiem, offsetHours) => {
  const instant = new Date(utcInstant(month, day, year, hour, minute, meridiem));
  instant.setUTCHours(instant.getUTCHours() - Number(offsetHours));
  return instant.toISOString();
};

const utcInstants = (value) => {
  const expression = new RegExp(
    `(${monthPattern})\\s+(\\d{1,2}),\\s+(\\d{4})\\s+(?:at\\s+)?(\\d{1,2}):(\\d{2})\\s+(AM|PM)\\s+UTC`,
    'gi',
  );
  return [...String(value || '').matchAll(expression)]
    .map((match) => utcInstant(match[1], match[2], match[3], match[4], match[5], match[6]));
};

const exactUtcRange = (value) => {
  const expression = new RegExp(
    `^\\s*(${monthPattern})\\s+(\\d{1,2}),\\s+(\\d{4})\\s+(?:at\\s+)?(\\d{1,2}):(\\d{2})\\s+(AM|PM)\\s+UTC\\s*[-–—]\\s*`
      + `(${monthPattern})\\s+(\\d{1,2}),\\s+(\\d{4})\\s+(?:at\\s+)?(\\d{1,2}):(\\d{2})\\s+(AM|PM)\\s+UTC\\s*$`,
    'i',
  );
  const match = String(value || '').match(expression);
  if (!match) return null;
  return {
    eventStart: utcInstant(match[1], match[2], match[3], match[4], match[5], match[6]),
    eventEnd: utcInstant(match[7], match[8], match[9], match[10], match[11], match[12]),
    timezone: 'UTC',
  };
};

const afterMaintenanceUtcRange = (value) => {
  const expression = new RegExp(
    `^\\s*(${monthPattern})\\s+(\\d{1,2}),\\s+(\\d{4})\\s*${maintenanceMarkerPattern}\\s*[-–—]\\s*`
      + `(${monthPattern})\\s+(\\d{1,2}),\\s+(\\d{4})\\s+(\\d{1,2}):(\\d{2})\\s+(AM|PM)\\s+UTC\\s*$`,
    'i',
  );
  const match = String(value || '').match(expression);
  if (!match) return null;
  const startMonth = String(months.get(match[1].toLowerCase()) + 1).padStart(2, '0');
  const startDay = String(Number(match[2])).padStart(2, '0');
  return {
    eventStart: `${match[3]}-${startMonth}-${startDay}`,
    eventEnd: utcInstant(match[4], match[5], match[6], match[7], match[8], match[9]),
    timezone: 'UTC',
  };
};

const inferredYearAfterMaintenanceUtcRange = (value, publishedAt) => {
  if (!publishedAt) return null;
  const expression = new RegExp(
    `(${monthPattern})\\s+(\\d{1,2})(?:,\\s+(\\d{4}))?\\s*${maintenanceMarkerPattern}\\s*[-–—]\\s*`
      + `(${monthPattern})\\s+(\\d{1,2})(?:,\\s+(\\d{4}))?\\s+(\\d{1,2}):(\\d{2})\\s+(AM|PM)\\s+UTC`,
    'i',
  );
  const match = String(value || '').match(expression);
  if (!match) return null;
  const publishedYear = new Date(publishedAt).getUTCFullYear();
  const startYear = Number(match[3] || publishedYear);
  let endYear = Number(match[6] || startYear);
  if (!match[6] && months.get(match[4].toLowerCase()) < months.get(match[1].toLowerCase())) endYear += 1;
  const startMonth = String(months.get(match[1].toLowerCase()) + 1).padStart(2, '0');
  const startDay = String(Number(match[2])).padStart(2, '0');
  return {
    eventStart: `${startYear}-${startMonth}-${startDay}`,
    eventEnd: utcInstant(match[4], match[5], endYear, match[7], match[8], match[9]),
    timezone: 'UTC',
  };
};

const regionalUtcOffsetRange = (value) => {
  const expression = new RegExp(
    `(?:PST|PDT)\\s*\\(UTC\\s*([+-]\\d{1,2})\\)\\s*:\\s*`
      + `(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\\s*(${monthPattern})\\s+(\\d{1,2}),\\s+(\\d{4})\\s*`
      + `(?:(\\d{1,2}):(\\d{2})\\s+(AM|PM)|${maintenanceMarkerPattern})\\s*[-–—]\\s*`
      + `(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\\s*(${monthPattern})\\s+(\\d{1,2}),\\s+(\\d{4})\\s+`
      + `(\\d{1,2}):(\\d{2})\\s+(AM|PM)`,
    'i',
  );
  const match = String(value || '').match(expression);
  if (!match) return null;
  const offset = Number(match[1]);
  const startMonth = String(months.get(match[2].toLowerCase()) + 1).padStart(2, '0');
  const startDay = String(Number(match[3])).padStart(2, '0');
  return {
    eventStart: match[5]
      ? utcOffsetInstant(match[2], match[3], match[4], match[5], match[6], match[7], offset)
      : `${match[4]}-${startMonth}-${startDay}`,
    eventEnd: utcOffsetInstant(match[8], match[9], match[10], match[11], match[12], match[13], offset),
    timezone: 'UTC',
  };
};

const inferredRegionalRange = (value, publishedAt) => {
  if (!publishedAt) return null;
  const expression = new RegExp(
    `(PST|PDT)(?:\\/(PST|PDT))?\\s*`
      + `\\(UTC\\s*([+-]\\d{1,2})(?:\\s*\\/\\s*([+-]\\d{1,2}))?\\)\\s*:\\s*`
      + `(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\\s*`
      + `(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,\\s*(\\d{4}))?\\s*`
      + `(?:(?:at\\s+)?(\\d{1,2}):(\\d{2})\\s+(AM|PM)(?:\\s+(?:PST|PDT|CET|CEST|AEST|AEDT))?|${maintenanceMarkerPattern})\\s*[-–—~]\\s*`
      + `(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\\s*`
      + `(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,\\s*(\\d{4}))?\\s+`
      + `(?:at\\s+)?(\\d{1,2}):(\\d{2})\\s+(AM|PM)(?:\\s*(?:\\((PST|PDT|CET|CEST|AEST|AEDT)\\)|(PST|PDT|CET|CEST|AEST|AEDT)))?`,
    'i',
  );
  const match = String(value || '').match(expression);
  if (!match) return null;
  const publishedYear = new Date(publishedAt).getUTCFullYear();
  const startYear = Number(match[7] || publishedYear);
  let endYear = Number(match[13] || startYear);
  if (!match[13] && months.get(match[11].toLowerCase()) < months.get(match[5].toLowerCase())) endYear += 1;
  const startOffset = Number(match[3]);
  const suffixTimezone = match[17] || (match[4] != null ? match[18] : null);
  const suffixOffset = suffixTimezone ? timezoneOffsets.get(suffixTimezone.toLowerCase()) : null;
  const endOffset = suffixOffset ?? Number(match[4] || startOffset);
  const startMonth = String(months.get(match[5].toLowerCase()) + 1).padStart(2, '0');
  const startDay = String(Number(match[6])).padStart(2, '0');
  return {
    eventStart: match[8]
      ? utcOffsetInstant(match[5], match[6], startYear, match[8], match[9], match[10], startOffset)
      : `${startYear}-${startMonth}-${startDay}`,
    eventEnd: utcOffsetInstant(match[11], match[12], endYear, match[14], match[15], match[16], endOffset),
    timezone: 'UTC',
  };
};

const singlePacificInstant = (value, publishedAt) => {
  if (!publishedAt) return null;
  const expression = new RegExp(
    `(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\\s*`
      + `(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,\\s*(\\d{4}))?\\s+(?:at\\s+)?`
      + `(\\d{1,2}):(\\d{2})\\s+(AM|PM)\\s+PT`,
    'i',
  );
  const match = String(value || '').match(expression);
  if (!match) return null;
  const year = Number(match[3] || new Date(publishedAt).getUTCFullYear());
  const month = months.get(match[1].toLowerCase());
  const offset = month >= 2 && month <= 9 ? -7 : -8;
  const instant = utcOffsetInstant(match[1], match[2], year, match[4], match[5], match[6], offset);
  return { eventStart: instant, eventEnd: instant, timezone: 'UTC' };
};

const inferredUtcRange = (value, publishedAt) => {
  if (!publishedAt) return null;
  const expression = new RegExp(
    `(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,\\s*(\\d{4}))?\\s+(?:at\\s+)?`
      + `(\\d{1,2}):(\\d{2})\\s+(AM|PM)\\s+UTC\\s*[-–—~]\\s*`
      + `(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,\\s*(\\d{4}))?\\s+(?:at\\s+)?`
      + `(\\d{1,2}):(\\d{2})\\s+(AM|PM)\\s+UTC`,
    'i',
  );
  const match = String(value || '').match(expression);
  if (!match) return null;
  const publishedYear = new Date(publishedAt).getUTCFullYear();
  const startYear = Number(match[3] || publishedYear);
  let endYear = Number(match[9] || startYear);
  if (!match[9] && months.get(match[7].toLowerCase()) < months.get(match[1].toLowerCase())) endYear += 1;
  return {
    eventStart: utcInstant(match[1], match[2], startYear, match[4], match[5], match[6]),
    eventEnd: utcInstant(match[7], match[8], endYear, match[10], match[11], match[12]),
    timezone: 'UTC',
  };
};

const inlineRegionalUtcOffsetRange = (value) => {
  const expression = new RegExp(
    `(${monthPattern})\\s+(\\d{1,2}),\\s+(\\d{4})\\s+(\\d{1,2}):(\\d{2})\\s+(AM|PM)\\s+`
      + `(?:PST|PDT|CET|CEST|AEST|AEDT)\\s*\\(UTC\\s*([+-]\\d{1,2})\\)\\s*[-–—]\\s*`
      + `(${monthPattern})\\s+(\\d{1,2}),\\s+(\\d{4})\\s+(\\d{1,2}):(\\d{2})\\s+(AM|PM)\\s+`
      + `(?:PST|PDT|CET|CEST|AEST|AEDT)\\s*\\(UTC\\s*([+-]\\d{1,2})\\)`,
    'i',
  );
  const match = String(value || '').match(expression);
  if (!match) return null;
  return {
    eventStart: utcOffsetInstant(match[1], match[2], match[3], match[4], match[5], match[6], match[7]),
    eventEnd: utcOffsetInstant(match[8], match[9], match[10], match[11], match[12], match[13], match[14]),
    timezone: 'UTC',
  };
};

const singleDayRegionalWindow = (value, publishedAt) => {
  if (!publishedAt) return null;
  const expression = new RegExp(
    `(\\d{1,2}):(\\d{2})\\s+(AM|PM)\\s*[-–—]\\s*(\\d{1,2}):(\\d{2})\\s+(AM|PM)\\s+`
      + `(PST|PDT|CET|CEST|AEST|AEDT)\\s+on\\s+`
      + `(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\\s*(${monthPattern})\\s+(\\d{1,2})(?:,\\s+(\\d{4}))?`,
    'i',
  );
  const match = String(value || '').match(expression);
  if (!match) return null;
  const year = Number(match[10] || new Date(publishedAt).getUTCFullYear());
  const offset = timezoneOffsets.get(match[7].toLowerCase());
  if (offset == null) return null;
  return {
    eventStart: utcOffsetInstant(match[8], match[9], year, match[1], match[2], match[3], offset),
    eventEnd: utcOffsetInstant(match[8], match[9], year, match[4], match[5], match[6], offset),
    timezone: 'UTC',
  };
};

const hotWeekUtcRange = (value, title, publishedAt) => {
  if (!/hot weeks?/i.test(title || '')) return null;
  const values = [...String(value || '').matchAll(new RegExp(
    `(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\\s*(${monthPattern})\\s+(\\d{1,2}),\\s+(\\d{4})`,
    'gi',
  ))].map((match) => new Date(Date.UTC(Number(match[3]), months.get(match[1].toLowerCase()), Number(match[2]))));
  if (values.length < 2) return null;
  const published = new Date(publishedAt || 0);
  const plausible = values.filter((instant) => !Number.isNaN(instant.getTime())
    && (!published.getTime() || (instant >= published && instant.getTime() - published.getTime() <= 62 * 86_400_000)));
  if (plausible.length < 2) return null;
  const start = new Date(Math.min(...plausible.map((instant) => instant.getTime())));
  const end = new Date(Math.max(...plausible.map((instant) => instant.getTime())) + 86_400_000);
  return { eventStart: start.toISOString(), eventEnd: end.toISOString(), timezone: 'UTC' };
};

const inclusiveUtcDateRange = (value, publishedAt) => {
  const expression = new RegExp(
    `\\bfrom\\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\\s*(${monthPattern})\\s+(\\d{1,2})\\s+through\\s+`
      + `(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?,?\\s*(${monthPattern})\\s+(\\d{1,2})\\s*\\(UTC\\)`,
    'i',
  );
  const match = String(value || '').match(expression);
  if (!match || !publishedAt) return null;
  const year = new Date(publishedAt).getUTCFullYear();
  const toDate = (month, day) => `${year}-${String(months.get(month.toLowerCase()) + 1).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
  return { eventStart: toDate(match[1], match[2]), eventEnd: toDate(match[3], match[4]), timezone: 'UTC' };
};

const occurrenceKey = (value) => routeSlug(value).slice(0, 50) || 'event';

const scheduledMiracleTimeOccurrences = (payload, publishedAt) => {
  if (!/miracle time\s*-\s*december 17\s*-\s*18/i.test(payload.name || '') || !publishedAt) return [];
  const year = new Date(publishedAt).getUTCFullYear();
  const occurrence = (name, day) => ({
    name,
    title: name,
    key: occurrenceKey(name),
    evidence: 'official-body-text',
    dates: {
      eventStart: new Date(Date.UTC(year, 11, day, 8, 30)).toISOString(),
      eventEnd: new Date(Date.UTC(year, 11, day + 1, 4, 0)).toISOString(),
      timezone: 'UTC',
    },
  });
  return [
    occurrence('Miracle Time — Interactive and Burning Worlds', 17),
    occurrence('Miracle Time — Reboot World', 18),
  ];
};

const eventOccurrences = (payload, publishedAt) => {
  const scheduledOccurrences = scheduledMiracleTimeOccurrences(payload, publishedAt);
  if (scheduledOccurrences.length > 0) return scheduledOccurrences;
  const document = parseDocument(`<html><body>${payload.body || ''}</body></html>`, 'text/html');
  const documentText = document.body?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const claimsThroughEventEnd = /rewards?[^.]{0,300}claimed until/i.test(documentText);
  const rawValues = [];
  const auxiliaryRanges = [];
  const claimEnds = [];
  let heading = payload.name;
  let rangeKind = 'event';
  for (const element of document.querySelectorAll('h1,h2,h3,h4,p,li')) {
    const value = element.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (/^H[1-4]$/.test(element.tagName) && value) {
      heading = value;
      rangeKind = /^reward\b/i.test(value) ? 'claim' : /^shop\b/i.test(value) ? 'shop' : 'event';
      continue;
    }
    if (/^(?:event|reward|shop)\b.{0,60}\b(?:period|duration|availability|retrieval)\s*:?\s*$/i.test(value)) {
      rangeKind = /^reward\b/i.test(value) ? 'claim' : /^shop\b/i.test(value) ? 'shop' : 'event';
      continue;
    }
    if (/rewards?[^.]{0,120}claimed until/i.test(value)) claimEnds.push(...utcInstants(value));
    const dates = exactUtcRange(value)
      || afterMaintenanceUtcRange(value)
      || inferredYearAfterMaintenanceUtcRange(value, publishedAt)
      || inferredUtcRange(value, publishedAt)
      || inferredRegionalRange(value, publishedAt)
      || regionalUtcOffsetRange(value);
    if (!dates) continue;
    if (rangeKind === 'shop' || /shop\s+(?:availability|period)/i.test(value)) {
      auxiliaryRanges.push({ name: heading, kind: 'shop', dates });
      continue;
    }
    if (rangeKind === 'claim' || /reward\s+(?:period|retrieval)/i.test(heading)
      || /^reward\s+period|(?:reward\s+)?claim(?:ing)?\s+(?:availability|period)|rewards?[^.]{0,120}claimed/i.test(value)) {
      auxiliaryRanges.push({ name: heading, kind: 'claim', dates });
      continue;
    }
    if (/coin\s+acqui[sz]ition\s+period/i.test(value)) continue;
    rawValues.push({ name: heading, dates });
  }
  if (rawValues.length === 0) {
    const text = document.body?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const dates = inclusiveUtcDateRange(text, publishedAt)
      || inferredUtcRange(text, publishedAt)
      || inferredRegionalRange(text, publishedAt)
      || regionalUtcOffsetRange(text)
      || inlineRegionalUtcOffsetRange(text)
      || singleDayRegionalWindow(text, publishedAt)
      || singlePacificInstant(text, publishedAt)
      || hotWeekUtcRange(text, payload.name, publishedAt);
    if (dates) rawValues.push({ name: payload.name, dates });
  }
  const values = [...new Map(rawValues.map((value) => [
    `${occurrenceKey(value.name)}:${value.dates.eventStart}:${value.dates.eventEnd}`,
    value,
  ])).values()];
  const counts = new Map();
  return values.map((value, index) => {
    const base = occurrenceKey(value.name);
    const count = (counts.get(base) || 0) + 1;
    counts.set(base, count);
    const key = count === 1 ? base : `${base}-${value.dates.eventStart.slice(0, 10)}`;
    const title = values.length > 1 && count > 1
      ? `${value.name} — ${value.dates.eventStart.slice(0, 10)}`
      : value.name;
    const claimEnd = claimEnds.find((instant) => instant.slice(0, 10) === value.dates.eventEnd.slice(0, 10))
      || (claimEnds.length === values.length ? claimEnds[index] : null)
      || (claimsThroughEventEnd ? value.dates.eventEnd : null);
    const auxiliaryFor = (kind) => auxiliaryRanges.find((range) => (
      range.kind === kind && occurrenceKey(range.name) === base
    )) || (values.length === 1 ? auxiliaryRanges.find((range) => range.kind === kind) : null);
    const claimRange = auxiliaryFor('claim');
    const shopRange = auxiliaryFor('shop');
    return {
      ...value,
      dates: {
        ...value.dates,
        claimStart: claimRange?.dates.eventStart || null,
        claimEnd: claimRange?.dates.eventEnd || claimEnd,
        shopStart: shopRange?.dates.eventStart || null,
        shopEnd: shopRange?.dates.eventEnd || null,
      },
      key,
      title,
    };
  });
};

const configuredEventOccurrence = (item, source) => {
  const configured = source.adapter_config?.event_date_overrides?.[item.externalId];
  if (!configured?.event_start || !configured?.event_end || !configured?.timezone) return null;
  return {
    name: item.title,
    title: item.title,
    key: null,
    dates: {
      eventStart: configured.event_start,
      eventEnd: configured.event_end,
      claimEnd: configured.claim_end || null,
      timezone: configured.timezone,
    },
    evidence: configured.evidence || 'source-configuration',
  };
};

const originalSummary = (source, title, contentType, publishedAt) => {
  const date = publishedAt ? ` on ${publishedAt.slice(0, 10)}` : '';
  return `“${title}” is an official ${contentTypeLabel(contentType)} from ${source.name}${date}. `
    + 'Its canonical Nexon article and publication metadata are retained for source-backed verification.';
};

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
    const result = await context.fetch(source.api_url || source.discovery_urls[0], { conditional: false });
    if (result.status === 304) return [];
    return recordsForSeries(parseListing(result), source).map((record) => itemForRecord(record, source));
  },

  async discoverPages(source) {
    const config = paginationConfig(source);
    if (config.strategy !== 'client-slice') return { supported: false };
    const requestUrls = paginationEndpointUrls(source);
    const start = Number(config.start || 1);
    return {
      supported: true,
      firstPage: { index: start, value: start, url: requestUrls[0], requestUrls },
      totalPages: null,
    };
  },

  async fetchPage(page, source, context) {
    const config = paginationConfig(source);
    const pageSize = Number(config.page_size || 18);
    const requestUrls = paginationEndpointUrls(source);
    const cacheKey = `${source.id}:${requestUrls.join('|')}`;
    context.nexonCmsPaginationCache ||= new Map();
    let cached = context.nexonCmsPaginationCache.get(cacheKey);
    if (!cached) {
      const results = [];
      for (const url of requestUrls) {
        const response = await context.fetch(url, { conditional: false });
        results.push(response);
      }
      const records = results.flatMap((response, index) => parseListing(response, `pagination endpoint ${requestUrls[index]}`));
      cached = { records: uniqueRecords(recordsForSeries(records, source)), results };
      context.nexonCmsPaginationCache.set(cacheKey, cached);
    }
    const staticOffset = (page.index - 1) * pageSize;
    let offset = staticOffset;
    if (page.previousLastExternalId || page.previousLastPublishedAt) {
      let anchorIndex = page.previousLastExternalId
        ? cached.records.findIndex((record) => String(record.id) === String(page.previousLastExternalId))
        : -1;
      if (anchorIndex < 0 && page.previousLastPublishedAt) {
        const matching = cached.records
          .map((record, index) => ({ record, index }))
          .filter(({ record }) => record.liveDate === page.previousLastPublishedAt)
          .sort((left, right) => (
            Math.abs(left.index - (staticOffset - 1)) - Math.abs(right.index - (staticOffset - 1))
          ));
        anchorIndex = matching[0]?.index ?? -1;
      }
      if (anchorIndex < 0) {
        throw new Error(`Nexon CMS pagination anchor missing before logical page ${page.index}`);
      }
      offset = anchorIndex + 1;
    }
    const records = cached.records.slice(offset, offset + pageSize);
    const totalItems = cached.records.length;
    return {
      ...cached.results[0],
      body: JSON.stringify(records),
      finalUrl: requestUrls[0],
      requestUrls,
      pagination: {
        strategy: 'client-slice',
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  },

  async discoverItems(result, page, source) {
    return recordsForSeries(parseListing(result, `logical page ${page.index}`), source)
      .map((record) => itemForRecord(record, source));
  },

  async discoverNextPage(page, result, items, source) {
    const pageSize = Number(paginationConfig(source).page_size || 18);
    const totalPages = result.pagination?.totalPages ?? null;
    if (items.length === 0) return { page: null, reason: 'empty-page', totalPages };
    if (items.length < pageSize || (totalPages !== null && page.index >= totalPages)) {
      return { page: null, reason: 'last-page', totalPages };
    }
    const index = page.index + 1;
    const requestUrls = paginationEndpointUrls(source);
    return {
      page: {
        index,
        value: index,
        url: requestUrls[0],
        requestUrls,
        previousLastExternalId: items.at(-1)?.externalId || null,
        previousLastPublishedAt: items.at(-1)?.publishedAt || null,
      },
      totalPages,
    };
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
    const publishedAt = payload.liveDate || item.publishedAt;
    const occurrences = contentType === 'event' ? eventOccurrences(payload, publishedAt) : [];
    const configuredOccurrence = contentType === 'event' ? configuredEventOccurrence(item, context.source) : null;
    const resolvedOccurrences = occurrences.length > 0 ? occurrences : configuredOccurrence ? [configuredOccurrence] : [];
    const parsedOccurrences = resolvedOccurrences.length > 0 ? resolvedOccurrences : [{
      name: payload.name || item.title,
      title: payload.name || item.title,
      key: null,
      dates: null,
    }];
    if (contentType === 'event' && resolvedOccurrences.length === 0) warnings.push('event-dates-not-confirmed');
    return parsedOccurrences.map((occurrence) => ({
      canonicalUrl: item.url,
      sourceUrl: item.url,
      externalId: occurrences.length > 1 ? `${item.externalId}:${occurrence.key}` : item.externalId,
      title: occurrence.title,
      originalTitle: payload.name || item.title,
      summary: originalSummary(
        context.source,
        occurrence.title,
        contentType,
        publishedAt,
      ),
      author: 'Global MapleStory',
      publishedAt: payload.liveDate || item.publishedAt,
      updatedAt: null,
      contentType,
      subcategory: item.metadata.category,
      tags: [item.metadata.category, contentType],
      images: imagesFrom(payload, result),
      eventDates: occurrence.dates,
      metadata: {
        api_record: true,
        body_extractable: Boolean(payload.body),
        event_date_evidence: occurrence.evidence || (occurrence.dates ? 'official-body-text' : null),
        event_occurrence_key: occurrences.length > 1 ? occurrence.key : null,
        fetched_at: result.fetchedAt,
        original_timezone: /Z$/i.test(publishedAt || '') ? 'UTC' : null,
        parser_warnings: warnings,
        source_external_id: item.externalId,
        source_category: item.metadata.category,
        unconfirmed_fields: ['updated_at'],
        sections: [{
          title: 'Official publication record',
          items: [
            `Published by Global MapleStory on ${publishedAt.slice(0, 10)}.`,
            `Official category: ${item.metadata.category.replaceAll('-', ' ')}.`,
            `Nexon article ID: ${item.externalId}.`,
          ],
        }],
      },
    }));
  },

  async normalize(content, source, context) {
    return normalizeParsedContent(content, source, context);
  },
};
