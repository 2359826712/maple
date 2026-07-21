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
  review_status: 'automatic' | 'reviewed';
  updated_at: string;
};

export async function readCurrentSeriesContentTranslation(
  contentId: string,
  locale: StaticContentLanguage,
) {
  const pool = getPool();
  if (!pool) throw new Error('translation database is unavailable');
  const result = await pool.query<CurrentSeriesContentTranslation>(`
    select translation.content_id, translation.locale, translation.title,
           translation.summary, translation.body_html, translation.source_revision,
           translation.provider, translation.model, translation.review_status,
           translation.updated_at
    from public.series_content_translations as translation
    join public.series_content as content on content.id = translation.content_id
    where translation.content_id = $1
      and translation.locale = $2
      and translation.source_revision = content.source_revision
      and translation.review_status in ('automatic', 'reviewed')
  `, [contentId, locale]);
  return result.rows[0] || null;
}
