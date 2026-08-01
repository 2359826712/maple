import {
  normalizeStaticContentLanguage,
  type StaticContentLanguage,
} from './staticTranslation';

export type PublishedSeriesTranslation = {
  slug: string;
  content_id: string;
  locale: StaticContentLanguage;
  title: string;
  summary: string;
  body_html?: string;
  source_revision: string;
  provider: string;
  model: string;
  glossary_version: string;
  quality_checks: Record<string, unknown>;
  review_status: 'automatic' | 'approved';
  updated_at: string;
};

type PublishedSeriesTranslationResponse = {
  translations?: Record<string, PublishedSeriesTranslation>;
};

export async function fetchPublishedSeriesTranslations(
  contentIds: string[],
  language: string,
): Promise<Record<string, PublishedSeriesTranslation>> {
  const locale = normalizeStaticContentLanguage(language);
  const slugs = [...new Set(contentIds.filter(Boolean))].slice(0, 50);
  if (locale === 'en' || slugs.length === 0) return {};
  const query = new URLSearchParams({
    locale,
    slugs: slugs.join(','),
  });
  const response = await fetch(`/api/content-translations?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return {};
  const payload = await response.json() as PublishedSeriesTranslationResponse;
  return payload.translations || {};
}
