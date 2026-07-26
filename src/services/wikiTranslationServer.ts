import { Pool } from 'pg';
import type { SupportedLanguage } from '@/i18n/languageRouting';
import type { PublishedWikiTranslation } from './wikiTranslation';

let pool: Pool | undefined;

const getPool = () => {
  const connectionString =
    process.env.LOCALIZATION_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!connectionString) return null;
  pool ??= new Pool({
    connectionString,
    max: 2,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });
  return pool;
};

export const fetchPublishedWikiTranslation = async (
  canonicalTitle: string,
  locale: Exclude<SupportedLanguage, 'en'>,
) => {
  const database = getPool();
  if (!database) return null;

  const result = await database.query<PublishedWikiTranslation>(
    `
      select translation.title, translation.summary, translation.body_html,
             translation.source_revision
      from public.series_wiki_pages as page
      join public.series_wiki_translations as translation
        on translation.wiki_page_id = page.id
       and translation.locale = $2
       and translation.source_revision is not distinct from page.source_revision
      where lower(page.canonical_title) = lower($1)
        and page.status = 'published'
        and translation.review_status in ('automatic', 'approved', 'reviewed')
      order by page.updated_at desc
      limit 1
    `,
    [canonicalTitle, locale],
  );
  return result.rows[0] ?? null;
};
