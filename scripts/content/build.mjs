import { readContentRecords, readSourceRecords } from './data.mjs';

const compare = (left, right) => left.localeCompare(right);

export function createContentIndexes(contentRecords, sourceRecords) {
  const content = contentRecords.map((record) => record.data).sort((left, right) => compare(left.id, right.id));
  const sources = sourceRecords.map((record) => record.data).sort((left, right) => compare(left.id, right.id));
  const byType = {};
  const byStatus = {};
  for (const record of content) {
    byType[record.content_type] = (byType[record.content_type] || 0) + 1;
    byStatus[record.status] = (byStatus[record.status] || 0) + 1;
  }
  const statistics = {
    total_content: content.length,
    total_sources: sources.length,
    enabled_sources: sources.filter((source) => source.enabled).length,
    content_types: Object.fromEntries(Object.entries(byType).sort(([left], [right]) => compare(left, right))),
    statuses: Object.fromEntries(Object.entries(byStatus).sort(([left], [right]) => compare(left, right))),
  };
  const search = content.map((record) => ({
    record_type: 'content',
    id: record.id,
    title: record.title,
    summary: record.summary,
    tags: record.tags,
    series: record.series,
    regions: record.regions,
    languages: record.languages,
    source: record.source_id,
    content_type: record.content_type,
    published_at: record.published_at,
    event_start: record.event_start || null,
    event_end: record.event_end || null,
    class_name: record.class_name || null,
    boss_name: record.boss_name || null,
    game_version: record.game_version || null,
    official: record.official,
    status: record.status,
    url: record.canonical_url,
  }));
  return { content, sources, 'content-statistics': statistics, search };
}

export async function readContentIndexes() {
  return createContentIndexes(await readContentRecords(), await readSourceRecords());
}
