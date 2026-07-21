import { createHash } from 'node:crypto';

export const publisherLocales = ['en', 'zh', 'zh-Hant', 'ja', 'ko'];

export const contentSeriesIds = {
  maplestory: 'maplestory-pc',
  classic: 'maplestory-classic',
  m: 'maplestory-m',
  worlds: 'maplestory-worlds',
  n: 'maplestory-n',
  idle: 'maplestory-idle',
};

export const contentTypeModules = {
  news: 'news',
  event: 'events',
  guide: 'guides',
  'patch-note': 'upcoming',
  maintenance: 'upcoming',
  'cash-shop': 'shop',
  'developer-note': 'news',
  roadmap: 'upcoming',
  'api-announcement': 'tools',
  'creator-announcement': 'news',
};

const fixedSeriesEditions = {
  classic: 'maplestory-classic:global-test',
  m: 'maplestory-m:global',
  worlds: 'maplestory-worlds:global',
  n: 'maplestory-n:global',
  idle: 'maplestory-idle:global',
};

const projectedColumnNames = [
  'series_id',
  'edition_id',
  'module',
  'slug',
  'source_language',
  'title',
  'summary',
  'body_html',
  'source_label',
  'source_url',
  'source_revision',
  'published_at',
  'source_updated_at',
  'verified_at',
  'status',
  'content_data',
];

const baseContentFields = new Set([
  'id',
  'series',
  'languages',
  'title',
  'summary',
  'body_text',
  'body_markdown',
  'body_html',
  'source_id',
  'canonical_url',
  'source_url',
  'content_hash',
  'discovered_at',
  'last_checked',
  'translation_status',
  'notes',
  'status',
  'published_at',
  'updated_at',
]);

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)]),
  );
}

function stableJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256(value) {
  return `sha256:${createHash('sha256').update(stableJson(value), 'utf8').digest('hex')}`;
}

function sourceLanguage(record) {
  const languages = Array.isArray(record.languages) ? [...new Set(record.languages)] : [];
  const localeMap = { en: 'en', ko: 'ko', ja: 'ja', 'zh-hans': 'zh', 'zh-hant': 'zh-Hant' };
  if (languages.length !== 1 || !localeMap[languages[0]]) {
    throw new Error(`expected exactly one supported source language, received ${JSON.stringify(languages)}`);
  }
  return localeMap[languages[0]];
}

function editionId(record) {
  if (fixedSeriesEditions[record.series]) return fixedSeriesEditions[record.series];
  if (record.series !== 'maplestory') return null;

  const regions = new Set(record.regions || []);
  if (regions.has('north-america') || regions.has('europe')) return 'maplestory-pc:gms';
  if (regions.has('korea')) return 'maplestory-pc:kms';
  if (regions.has('japan')) return 'maplestory-pc:jms';
  if (regions.has('taiwan')) return 'maplestory-pc:tms';
  if (regions.has('sea')) return 'maplestory-pc:msea';
  return null;
}

function publishedStatus(status) {
  if (status === 'removed' || status === 'archived') return 'archived';
  if (status === 'draft') return 'draft';
  if (['published', 'updated', 'expired'].includes(status)) return 'published';
  throw new Error(`unsupported content status ${JSON.stringify(status)}`);
}

function contentData(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([key, value]) => !baseContentFields.has(key) && value !== undefined),
  );
}

function bodyHtml(record) {
  if (typeof record.body_html === 'string') return record.body_html;
  if (record.body_text || record.body_markdown) {
    throw new Error('body_text/body_markdown requires an explicit, sanitized body_html conversion');
  }
  return '';
}

function normalizeTimestamp(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toISOString();
}

function normalizedProjectedRow(row) {
  const normalized = Object.fromEntries(projectedColumnNames.map((name) => [name, row[name] ?? null]));
  for (const field of ['published_at', 'source_updated_at', 'verified_at']) {
    normalized[field] = normalizeTimestamp(normalized[field]);
  }
  normalized.content_data = canonicalize(normalized.content_data || {});
  return normalized;
}

export function createProjection(record, source) {
  if (!source) throw new Error(`unknown source_id ${JSON.stringify(record.source_id)}`);
  if (source.id !== record.source_id) throw new Error('source lookup returned the wrong source');
  if (source.series !== undefined && source.series !== record.series) {
    throw new Error(`content series ${JSON.stringify(record.series)} does not match source series ${JSON.stringify(source.series)}`);
  }

  const seriesId = contentSeriesIds[record.series];
  const module = contentTypeModules[record.content_type];
  if (!seriesId) throw new Error(`unsupported series ${JSON.stringify(record.series)}`);
  if (!module) throw new Error(`unsupported content type ${JSON.stringify(record.content_type)}`);
  if (!record.id || record.id.length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id)) {
    throw new Error(`id cannot be used as a stable series_content slug: ${JSON.stringify(record.id)}`);
  }
  if (!record.canonical_url?.startsWith('https://')) {
    throw new Error(`canonical_url must be HTTPS: ${JSON.stringify(record.canonical_url)}`);
  }

  const language = sourceLanguage(record);
  const data = contentData(record);
  const body = bodyHtml(record);
  const revision = sha256({
    entity_type: 'series_content',
    title: record.title,
    summary: record.summary || '',
    body_html: body,
    content_data: data,
  });

  return {
    series_id: seriesId,
    edition_id: editionId(record),
    module,
    slug: record.id,
    source_language: language,
    title: record.title,
    summary: record.summary || '',
    body_html: body,
    source_label: source.name,
    source_url: record.canonical_url,
    source_revision: revision,
    published_at: record.published_at || null,
    source_updated_at: record.updated_at || null,
    verified_at: record.last_checked || record.discovered_at,
    status: publishedStatus(record.status),
    content_data: data,
    translations_needed: publisherLocales.filter((locale) => locale !== language),
  };
}

export function projectionKey(row) {
  return `${row.series_id}\u0000${row.module}\u0000${row.slug}`;
}

export function projectionAction(projection, existing) {
  if (!existing) return 'insert';
  return stableJson(normalizedProjectedRow(projection)) === stableJson(normalizedProjectedRow(existing))
    ? 'skip'
    : 'update';
}

export function buildPublisherPlan({ contentRecords, sourceRecords, existingRows = [] }) {
  const sources = new Map(sourceRecords.map(({ data }) => [data.id, data]));
  const existing = new Map(existingRows.map((row) => [projectionKey(row), row]));
  const records = [];
  const errors = [];
  const plannedKeys = new Set();

  for (const item of contentRecords) {
    try {
      const expectedSuffix = `${item.data.id}.json`;
      if (item.relativePath.split('/').at(-1) !== expectedSuffix) {
        throw new Error(`filename must match id (${expectedSuffix})`);
      }
      const projection = createProjection(item.data, sources.get(item.data.source_id));
      const key = projectionKey(projection);
      if (plannedKeys.has(key)) throw new Error(`duplicate publisher identity ${JSON.stringify(key)}`);
      plannedKeys.add(key);
      records.push({
        source_file: item.relativePath,
        action: projectionAction(projection, existing.get(key)),
        ...projection,
      });
    } catch (error) {
      errors.push({
        source_file: item.relativePath,
        id: item.data?.id || null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  records.sort((left, right) => left.source_file.localeCompare(right.source_file));
  errors.sort((left, right) => left.source_file.localeCompare(right.source_file));
  const counts = { insert: 0, update: 0, skip: 0, error: errors.length };
  for (const record of records) counts[record.action] += 1;

  const tally = (field) => Object.fromEntries(
    [...records.reduce((values, record) => {
      const key = record[field] ?? 'null';
      values.set(key, (values.get(key) || 0) + 1);
      return values;
    }, new Map())].sort(([left], [right]) => String(left).localeCompare(String(right))),
  );

  return {
    summary: {
      files: contentRecords.length,
      valid: records.length,
      ...counts,
    },
    mappings: {
      series: tally('series_id'),
      editions: tally('edition_id'),
      modules: tally('module'),
      source_languages: tally('source_language'),
      statuses: tally('status'),
    },
    records,
    errors,
  };
}
