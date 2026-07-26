import { createHash } from 'node:crypto';
import { Pool } from 'pg';
import type { SupportedLanguage } from '@/i18n/languageRouting';

const publishedReviewStatuses = ['automatic', 'approved'] as const;
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

const hashSourceText = (value: string) =>
  createHash('sha256').update(value, 'utf8').digest('hex');

export type PublishedUiTranslationRow = {
  translation_key: string;
  translated_text: string;
  source_hash: string;
};

export const mergePublishedUiTranslations = (
  sourceMessages: Record<string, string>,
  localizedMessages: Record<string, string>,
  rows: PublishedUiTranslationRow[],
) => {
  const merged = { ...localizedMessages };
  for (const row of rows) {
    const sourceText = sourceMessages[row.translation_key];
    if (typeof sourceText !== 'string' || hashSourceText(sourceText) !== row.source_hash) continue;
    merged[row.translation_key] = row.translated_text;
  }
  return merged;
};

export const fetchPublishedUiTranslations = async (
  locale: Exclude<SupportedLanguage, 'en'>,
) => {
  const database = getPool();
  if (!database) return [];

  const result = await database.query<PublishedUiTranslationRow>(
    `
      select translation_key, translated_text, source_hash
      from public.ui_translations
      where namespace = 'common'
        and locale = $1
        and review_status = any($2::text[])
      order by translation_key
    `,
    [locale, publishedReviewStatuses],
  );
  return result.rows;
};
