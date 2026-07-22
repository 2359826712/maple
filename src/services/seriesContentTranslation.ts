import { Pool } from 'pg';
import type { StaticContentLanguage } from './staticTranslation';

type TranslationPoolGlobal = typeof globalThis & {
  __mapleSeriesTranslationPool?: Pool;
};

const globalState = globalThis as TranslationPoolGlobal;

const getPool = () => {
  const connectionString = process.env.LOCALIZATION_DATABASE_URL?.trim();
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

export type LocalizedSeriesContent = {
  content_id: string;
  requested_locale: StaticContentLanguage;
  source_language: StaticContentLanguage;
  localization_kind: 'translated' | 'source';
  title: string;
  summary: string;
  body_html: string;
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
  source_revision: string;
  source_updated_at: string;
  translated_title: string | null;
  translated_summary: string | null;
  translated_body_html: string | null;
  provider: string | null;
  model: string | null;
  glossary_version: string | null;
  quality_checks: Record<string, unknown> | null;
  review_status: 'automatic' | 'approved' | null;
  translation_updated_at: string | null;
};

export function mapLocalizedSeriesContent(
  row: LocalizedSeriesContentRow,
  locale: StaticContentLanguage,
): LocalizedSeriesContent {
  const translated = Boolean(row.translated_title) && locale !== row.source_language;
  return {
    content_id: row.content_id,
    requested_locale: locale,
    source_language: row.source_language,
    localization_kind: translated ? 'translated' : 'source',
    title: translated ? row.translated_title! : row.source_title,
    summary: translated ? row.translated_summary || '' : row.source_summary,
    body_html: translated ? row.translated_body_html || '' : row.source_body_html,
    source_revision: row.source_revision,
    provider: translated ? row.provider || 'unknown' : 'source',
    model: translated ? row.model || 'unknown' : 'source',
    glossary_version: translated ? row.glossary_version || '' : '',
    quality_checks: translated ? row.quality_checks || {} : {},
    review_status: translated ? row.review_status! : 'source',
    updated_at: translated ? row.translation_updated_at! : row.source_updated_at,
  };
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

export async function readLocalizedSeriesContent(
  contentId: string,
  locale: StaticContentLanguage,
): Promise<LocalizedSeriesContent | null> {
  const pool = getPool();
  if (!pool) throw new Error('translation database is unavailable');
  const result = await pool.query<LocalizedSeriesContentRow>(`
    select content.id as content_id, content.source_language,
           content.title as source_title, content.summary as source_summary,
           content.body_html as source_body_html, content.source_revision,
           content.updated_at as source_updated_at,
           translation.title as translated_title,
           translation.summary as translated_summary,
           translation.body_html as translated_body_html,
           translation.provider, translation.model, translation.glossary_version,
           translation.quality_checks, translation.review_status,
           translation.updated_at as translation_updated_at
    from public.series_content as content
    left join public.series_content_translations as translation
      on translation.content_id = content.id
     and translation.locale = $2
     and translation.source_revision = content.source_revision
     and translation.review_status in ('automatic', 'approved')
    where content.id = $1
      and content.status = 'published'
  `, [contentId, locale]);
  const row = result.rows[0];
  if (!row) return null;
  return mapLocalizedSeriesContent(row, locale);
}
