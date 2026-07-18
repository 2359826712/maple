import { normalizeCanonicalUrl } from '../lib/resource-index.mjs';
import { normalizeTitle } from './identity.mjs';

function groups(records, keyForRecord) {
  const values = new Map();
  for (const record of records) {
    const key = keyForRecord(record);
    if (!key) continue;
    const group = values.get(key) || [];
    group.push(record);
    values.set(key, group);
  }
  return [...values.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([value, group]) => ({ value, records: group }))
    .sort((left, right) => left.value.localeCompare(right.value));
}

export function findContentDuplicates(records) {
  return {
    ids: groups(records, (record) => record.data.id),
    urls: groups(records, (record) => normalizeCanonicalUrl(record.data.canonical_url)),
    externalIds: groups(records, (record) => record.data.external_id && `${record.data.source_id}:${record.data.external_id}`),
    hashes: groups(records, (record) => record.data.content_hash),
    titleDates: groups(records, (record) => `${record.data.series}:${normalizeTitle(record.data.title)}:${record.data.published_at || 'unknown'}`),
  };
}

export function findSourceDuplicates(records) {
  return { ids: groups(records, (record) => record.data.id) };
}
