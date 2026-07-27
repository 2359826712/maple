import {
  normalizeStaticContentLanguage,
  type StaticContentLanguage,
} from './staticTranslation';
import type { LocalizedSeriesContent } from './seriesContentTranslation';

export type PublishedSeriesTranslation = {
  slug: string;
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

type PublishedSeriesTranslationResponse = {
  translations?: Record<string, PublishedSeriesTranslation>;
};

export async function fetchPublishedSeriesTranslations(
  contentIds: string[],
  language: string,
): Promise<Record<string, PublishedSeriesTranslation>> {
  const locale = normalizeStaticContentLanguage(language);
  const slugs = [...new Set(contentIds.filter(Boolean))].slice(0, 50);
  if (slugs.length === 0) return {};
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

export async function fetchLocalizedSeriesContentBySlug(
  slug: string,
  language: string,
): Promise<LocalizedSeriesContent | null> {
  const locale = normalizeStaticContentLanguage(language);
  if (!slug) return null;
  const query = new URLSearchParams({ locale, slug });
  const response = await fetch(`/api/content-translations?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;
  const payload = await response.json() as { content?: LocalizedSeriesContent };
  return payload.content || null;
}
