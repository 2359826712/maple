import { createHash } from 'node:crypto';
import { normalizeCanonicalUrl } from '../lib/resource-index.mjs';

const transientHashFields = new Set([
  'canonical_url',
  'content_hash',
  'discovered_at',
  'external_id',
  'id',
  'languages',
  'last_checked',
  'metadata',
  'notes',
  'official',
  'regions',
  'related_content_ids',
  'related_urls',
  'source_id',
  'source_url',
  'status',
  'storage_mode',
  'translation_status',
]);

export function slugifyContentId(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled';
}

export function generateStableContentId({ series, region, sourceId, publishedAt, externalId, title }) {
  const sourceToken = String(sourceId).replace(new RegExp(`^${series}-`), '');
  const dateToken = publishedAt?.slice(0, 10) || 'undated';
  const identityToken = externalId ? slugifyContentId(externalId) : slugifyContentId(title);
  return [series, region || 'unknown', sourceToken, dateToken, identityToken]
    .map(slugifyContentId)
    .filter(Boolean)
    .join('-');
}

function sortForHash(value) {
  if (Array.isArray(value)) return value.map(sortForHash);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !transientHashFields.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortForHash(child)]),
  );
}

export function stableJson(value) {
  return JSON.stringify(sortForHash(value));
}

export function createContentHash(value) {
  return createHash('sha256').update(stableJson(value), 'utf8').digest('hex');
}

export function normalizeContentUrl(value, options) {
  return normalizeCanonicalUrl(value, options);
}

export function normalizeTitle(value) {
  return String(value).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}
