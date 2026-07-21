import { DOMParser } from 'linkedom';
import { createContentHash, generateStableContentId, normalizeContentUrl } from '../scripts/content/identity.mjs';

export function parseDocument(body, mimeType = 'text/html') {
  return new DOMParser().parseFromString(body, mimeType);
}

export function text(node) {
  return node?.textContent?.replace(/\s+/g, ' ').trim() || null;
}

export function absoluteUrl(value, baseUrl) {
  try {
    return normalizeContentUrl(new URL(value, baseUrl).href);
  } catch {
    return null;
  }
}

function meta(document, selector) {
  return document.querySelector(selector)?.getAttribute('content')?.trim() || null;
}

export function parseHtmlPage(result) {
  const document = parseDocument(result.body, 'text/html');
  const title = meta(document, 'meta[property="og:title"]') || text(document.querySelector('h1')) || text(document.querySelector('title'));
  const summary = meta(document, 'meta[name="description"]') || meta(document, 'meta[property="og:description"]');
  const publishedAt = meta(document, 'meta[property="article:published_time"]') || document.querySelector('time[datetime]')?.getAttribute('datetime') || null;
  const updatedAt = meta(document, 'meta[property="article:modified_time"]');
  const image = absoluteUrl(meta(document, 'meta[property="og:image"]'), result.finalUrl);
  const canonical = absoluteUrl(document.querySelector('link[rel="canonical"]')?.getAttribute('href'), result.finalUrl) || normalizeContentUrl(result.finalUrl);
  return {
    canonicalUrl: canonical,
    sourceUrl: result.finalUrl,
    externalId: result.discoveredItem?.externalId || null,
    title: result.discoveredItem?.title || title,
    originalTitle: title || result.discoveredItem?.title,
    summary,
    author: meta(document, 'meta[name="author"]'),
    publishedAt: result.discoveredItem?.publishedAt || publishedAt,
    updatedAt,
    images: image ? [{ url: image, alt: null }] : [],
    metadata: {
      content_type: result.contentType,
      fetched_at: result.fetchedAt,
      final_url: result.finalUrl,
      ...(result.discoveredItem?.metadata || {}),
    },
  };
}

function classifyContent(source, parsed) {
  if (parsed.contentType && source.content_types.includes(parsed.contentType)) return parsed.contentType;
  const configured = source.adapter_config.default_content_type;
  const title = String(parsed.title || '').toLowerCase();
  const matches = [
    ['maintenance', /maintenance|server check/],
    ['cash-shop', /cash shop|package|sale/],
    ['patch-note', /patch note|update note|version update/],
    ['developer-note', /developer.?s? note|dev note|director.?s? note/],
    ['roadmap', /roadmap|future update plan/],
    ['event', /event|festival|fiesta/],
    ['guide', /guide|how to|tutorial/],
  ];
  const detected = matches.find(([, pattern]) => pattern.test(title))?.[0];
  return source.content_types.includes(detected) ? detected : configured || source.content_types[0];
}

function normalizeTemporal(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value)) return value;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function specializedFields(contentType, parsed) {
  if (contentType === 'event') return {
    event_name: parsed.title,
    registration_start: null,
    registration_end: null,
    event_start: parsed.eventDates?.eventStart || null,
    event_end: parsed.eventDates?.eventEnd || null,
    claim_start: parsed.eventDates?.claimStart || null,
    claim_end: parsed.eventDates?.claimEnd || null,
    shop_start: parsed.eventDates?.shopStart || null,
    shop_end: parsed.eventDates?.shopEnd || null,
    timezone: parsed.eventDates?.timezone || null,
    eligibility: [],
    requirements: [],
    rewards: [],
    event_currency: [],
    event_shop: null,
    participation_steps: [],
    related_announcement_id: null,
    related_patch_ids: [],
    calendar_status: parsed.eventDates ? 'unknown' : 'unknown',
  };
  if (contentType === 'guide') return {
    guide_type: 'other',
    class_name: null,
    boss_name: null,
    system_name: null,
    level_range: null,
    difficulty: 'unknown',
    game_version: null,
    applicable_regions: [...sourceRegions(parsed)],
    prerequisites: [],
    steps: [],
    recommended_items: [],
    recommended_stats: [],
    outdated_warning: false,
  };
  if (contentType === 'patch-note') return {
    game_version: null,
    patch_date: parsed.publishedAt || null,
    maintenance_start: null,
    maintenance_end: null,
    changes: [],
    known_issues: [],
    resolved_issues: [],
  };
  return {};
}

function sourceRegions(parsed) {
  return parsed.__sourceRegions || [];
}

export function normalizeParsedContent(parsed, source, context) {
  if (!parsed.title || !parsed.canonicalUrl) return [];
  parsed.__sourceRegions = source.regions;
  const contentType = classifyContent(source, parsed);
  const publishedAt = normalizeTemporal(parsed.publishedAt);
  const record = {
    id: generateStableContentId({
      series: source.series,
      region: source.regions[0],
      sourceId: source.id,
      publishedAt,
      externalId: parsed.externalId,
      title: parsed.title,
    }),
    source_id: source.id,
    canonical_url: normalizeContentUrl(parsed.canonicalUrl),
    source_url: normalizeContentUrl(parsed.sourceUrl || parsed.canonicalUrl),
    external_id: parsed.externalId || null,
    title: parsed.title,
    original_title: parsed.originalTitle || parsed.title,
    series: source.series,
    regions: [...source.regions],
    languages: [...source.languages],
    content_type: contentType,
    subcategory: parsed.subcategory || null,
    official: source.official,
    author: parsed.author || null,
    published_at: publishedAt,
    updated_at: normalizeTemporal(parsed.updatedAt),
    discovered_at: context.now,
    last_checked: context.now,
    summary: source.storage_mode === 'metadata-only' ? null : parsed.summary || null,
    body_text: null,
    body_markdown: null,
    storage_mode: source.storage_mode,
    tags: [...new Set(parsed.tags || [])].sort(),
    images: parsed.images || [],
    attachments: [],
    related_content_ids: [],
    related_urls: [],
    content_hash: '',
    status: 'published',
    translation_status: 'not-requested',
    metadata: { parser: source.parser, ...(parsed.metadata || {}) },
    notes: null,
    ...specializedFields(contentType, parsed),
  };
  record.content_hash = createContentHash(record);
  return [record];
}

export function attachItem(result, item) {
  return { ...result, discoveredItem: item };
}
