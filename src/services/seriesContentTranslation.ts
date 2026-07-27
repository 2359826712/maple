import { Pool } from 'pg';
import type { StaticContentLanguage } from './staticTranslation';

type TranslationPoolGlobal = typeof globalThis & {
  __mapleSeriesTranslationPool?: Pool;
  __mapleSeriesFulltextReadAvailable?: Promise<boolean>;
};

const globalState = globalThis as TranslationPoolGlobal;

const getPool = () => {
  const connectionString = process.env.CONTENT_READ_DATABASE_URL?.trim();
  if (!connectionString) return undefined;
  if (!globalState.__mapleSeriesTranslationPool) {
    globalState.__mapleSeriesTranslationPool = new Pool({
      connectionString,
      max: 2,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
    });
  }
  return globalState.__mapleSeriesTranslationPool;
};

export type CurrentSeriesContentTranslation = {
  content_id: string;
  locale: StaticContentLanguage;
  title: string;
  summary: string;
  body_html: string;
  source_revision: string;
  provider: string;
  model: string;
  glossary_version: string;
  quality_checks: Record<string, unknown>;
  review_status: 'automatic' | 'approved';
  updated_at: string;
};

export type PublishedSeriesContentTranslation = CurrentSeriesContentTranslation & {
  slug: string;
};

export type LocalizedSeriesContentField = 'title' | 'summary' | 'body_html' | 'content_data';

export type LocalizedSeriesContent = {
  content_id: string;
  requested_locale: string;
  database_locale: StaticContentLanguage;
  source_language: StaticContentLanguage;
  localization_kind: 'translated' | 'partial' | 'source';
  localizationKind: 'translated' | 'partial' | 'source';
  title: string;
  summary: string;
  body_html: string;
  content_data: unknown;
  translated_fields: LocalizedSeriesContentField[];
  fallback_fields: LocalizedSeriesContentField[];
  translatedFields: LocalizedSeriesContentField[];
  fallbackFields: LocalizedSeriesContentField[];
  source_revision: string;
  provider: string;
  model: string;
  glossary_version: string;
  quality_checks: Record<string, unknown>;
  review_status: 'automatic' | 'approved' | 'source';
  updated_at: string;
};

export type LocalizedSeriesContentRow = {
  content_id: string;
  source_language: StaticContentLanguage;
  source_title: string;
  source_summary: string;
  source_body_html: string;
  source_content_data: unknown;
  source_revision: string;
  source_updated_at: string;
  translated_title: string | null;
  translated_summary: string | null;
  translated_body_html: string | null;
  translated_content_data: unknown | null;
  provider: string | null;
  model: string | null;
  glossary_version: string | null;
  quality_checks: Record<string, unknown> | null;
  review_status: 'automatic' | 'approved' | null;
  translation_updated_at: string | null;
  fulltext_translation_updated_at: string | null;
};

const hasText = (value: string | null | undefined) => Boolean(value?.trim());

const hasStructuredContent = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

export function normalizeDatabaseContentLocale(locale: string): StaticContentLanguage | null {
  const normalized = locale.trim().replaceAll('_', '-').toLowerCase();
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  if (
    normalized === 'zh-hant'
    || normalized.startsWith('zh-hant-')
    || normalized === 'zh-tw'
    || normalized.startsWith('zh-tw-')
    || normalized === 'zh-hk'
    || normalized.startsWith('zh-hk-')
  ) return 'zh-Hant';
  if (normalized === 'zh' || normalized === 'zh-cn' || normalized.startsWith('zh-cn-')) return 'zh';
  if (normalized === 'ja' || normalized.startsWith('ja-')) return 'ja';
  if (normalized === 'ko' || normalized.startsWith('ko-')) return 'ko';
  return null;
}

export function mapLocalizedSeriesContent(
  row: LocalizedSeriesContentRow,
  locale: StaticContentLanguage,
  requestedLocale: string = locale,
): LocalizedSeriesContent {
  const canTranslate = locale !== row.source_language;
  const translatedFields: LocalizedSeriesContentField[] = [];
  const fallbackFields: LocalizedSeriesContentField[] = [];

  const resolveText = (
    field: Extract<LocalizedSeriesContentField, 'title' | 'summary' | 'body_html'>,
    source: string,
    translated: string | null,
  ) => {
    if (canTranslate && hasText(translated)) {
      translatedFields.push(field);
      return translated!;
    }
    if (hasText(source)) fallbackFields.push(field);
    return source;
  };

  const title = resolveText('title', row.source_title, row.translated_title);
  const summary = resolveText('summary', row.source_summary, row.translated_summary);
  const bodyHtml = resolveText('body_html', row.source_body_html, row.translated_body_html);
  const translatedContentData = canTranslate && hasStructuredContent(row.translated_content_data);
  const contentData = translatedContentData
    ? row.translated_content_data
    : row.source_content_data;
  if (translatedContentData) translatedFields.push('content_data');
  else if (hasStructuredContent(row.source_content_data)) fallbackFields.push('content_data');

  const localizationKind = translatedFields.length === 0
    ? 'source'
    : fallbackFields.length === 0
      ? 'translated'
      : 'partial';
  const hasTextTranslation = translatedFields.some((field) => field !== 'content_data');
  const relevantUpdatedAt = [
    row.source_updated_at,
    hasTextTranslation ? row.translation_updated_at : null,
    translatedContentData ? row.fulltext_translation_updated_at : null,
  ].filter((value): value is string => Boolean(value)).sort().at(-1) || row.source_updated_at;

  return {
    content_id: row.content_id,
    requested_locale: requestedLocale,
    database_locale: locale,
    source_language: row.source_language,
    localization_kind: localizationKind,
    localizationKind,
    title,
    summary,
    body_html: bodyHtml,
    content_data: contentData,
    translated_fields: translatedFields,
    fallback_fields: fallbackFields,
    translatedFields,
    fallbackFields,
    source_revision: row.source_revision,
    provider: hasTextTranslation ? row.provider || 'unknown' : 'source',
    model: hasTextTranslation ? row.model || 'unknown' : 'source',
    glossary_version: hasTextTranslation ? row.glossary_version || '' : '',
    quality_checks: hasTextTranslation ? row.quality_checks || {} : {},
    review_status: hasTextTranslation ? row.review_status! : 'source',
    updated_at: relevantUpdatedAt,
  };
}

async function canReadFulltextTranslations(pool: Pool) {
  if (!globalState.__mapleSeriesFulltextReadAvailable) {
    globalState.__mapleSeriesFulltextReadAvailable = pool.query<{ available: boolean }>(`
      select to_regclass('public.series_content_fulltext_translations') is not null as available
    `).then((result) => result.rows[0]?.available === true);
  }
  return globalState.__mapleSeriesFulltextReadAvailable;
}

export async function readCurrentSeriesContentTranslation(
  contentId: string,
  locale: StaticContentLanguage,
) {
  const pool = getPool();
  if (!pool) throw new Error('translation database is unavailable');
  const result = await pool.query<CurrentSeriesContentTranslation>(`
    select translation.content_id, translation.locale, translation.title,
           translation.summary, translation.body_html, translation.source_revision,
           translation.provider, translation.model, translation.glossary_version,
           translation.quality_checks, translation.review_status,
           translation.updated_at
    from public.series_content_translations as translation
    join public.series_content as content on content.id = translation.content_id
    where translation.content_id = $1
      and translation.locale = $2
      and translation.source_revision = content.source_revision
      and translation.review_status in ('automatic', 'approved')
  `, [contentId, locale]);
  return result.rows[0] || null;
}

export async function readPublishedSeriesContentTranslationsBySlugs(
  slugs: string[],
  locale: StaticContentLanguage,
) {
  const pool = getPool();
  if (!pool) throw new Error('translation database is unavailable');
  if (slugs.length === 0) return {};
  const result = await pool.query<PublishedSeriesContentTranslation>(`
    select content.slug, translation.content_id, translation.locale,
           coalesce(nullif(btrim(translation.title), ''), content.title) as title,
           coalesce(nullif(btrim(translation.summary), ''), content.summary) as summary,
           coalesce(nullif(btrim(translation.body_html), ''), content.body_html) as body_html,
           translation.source_revision, translation.provider, translation.model,
           translation.glossary_version, translation.quality_checks,
           translation.review_status, translation.updated_at
    from public.series_content_translations as translation
    join public.series_content as content on content.id = translation.content_id
    where content.slug = any($1::text[])
      and content.status = 'published'
      and translation.locale = $2
      and translation.source_revision = content.source_revision
      and translation.review_status in ('automatic', 'approved')
  `, [slugs, locale]);
  return Object.fromEntries(result.rows.map((row) => [row.slug, row]));
}

async function readLocalizedSeriesContentBy(
  selector: 'id' | 'slug',
  value: string,
  locale: StaticContentLanguage,
  requestedLocale: string = locale,
): Promise<LocalizedSeriesContent | null> {
  const pool = getPool();
  if (!pool) throw new Error('translation database is unavailable');
  const fulltextAvailable = await canReadFulltextTranslations(pool);
  const fulltextColumns = fulltextAvailable
    ? `fulltext.translated_content_data,
           fulltext.updated_at as fulltext_translation_updated_at`
    : `null::jsonb as translated_content_data,
           null::timestamptz as fulltext_translation_updated_at`;
  const fulltextJoin = fulltextAvailable
    ? `left join public.series_content_fulltext_translations as fulltext
      on fulltext.content_id = content.id
     and fulltext.locale = $2
     and fulltext.source_revision = content.source_revision
     and fulltext.review_status in ('automatic', 'approved')`
    : '';
  const result = await pool.query<LocalizedSeriesContentRow>(`
    select content.id as content_id, content.source_language,
           content.title as source_title, content.summary as source_summary,
           content.body_html as source_body_html,
           content.content_data as source_content_data,
           content.source_revision,
           content.updated_at as source_updated_at,
           translation.title as translated_title,
           translation.summary as translated_summary,
           translation.body_html as translated_body_html,
           ${fulltextColumns},
           translation.provider, translation.model, translation.glossary_version,
           translation.quality_checks, translation.review_status,
           translation.updated_at as translation_updated_at
    from public.series_content as content
    left join public.series_content_translations as translation
      on translation.content_id = content.id
     and translation.locale = $2
     and translation.source_revision = content.source_revision
     and translation.review_status in ('automatic', 'approved')
    ${fulltextJoin}
    where content.${selector} = $1
      and content.status = 'published'
  `, [value, locale]);
  const row = result.rows[0];
  if (!row) return null;
  return mapLocalizedSeriesContent(row, locale, requestedLocale);
}

export function readLocalizedSeriesContent(
  contentId: string,
  locale: StaticContentLanguage,
  requestedLocale: string = locale,
) {
  return readLocalizedSeriesContentBy('id', contentId, locale, requestedLocale);
}

export function readLocalizedSeriesContentBySlug(
  slug: string,
  locale: StaticContentLanguage,
  requestedLocale: string = locale,
) {
  return readLocalizedSeriesContentBy('slug', slug, locale, requestedLocale);
}
