import type { NextApiRequest, NextApiResponse } from 'next';
import { normalizeLanguage } from '@/i18n/languageRouting';
import { fetchPublishedWikiTranslation } from '@/services/wikiTranslationServer';
import type { PublishedWikiTranslation } from '@/services/wikiTranslation';

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<PublishedWikiTranslation | { error: string }>,
) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawTitle = Array.isArray(request.query.title) ? request.query.title[0] : request.query.title;
  const rawLocale = Array.isArray(request.query.locale) ? request.query.locale[0] : request.query.locale;
  const locale = normalizeLanguage(rawLocale);
  if (!rawTitle?.trim() || rawTitle.length > 300 || locale === 'en') {
    response.status(400).json({ error: 'A supported localized title request is required' });
    return;
  }

  const translation = await fetchPublishedWikiTranslation(rawTitle.trim(), locale);
  if (!translation) {
    response.status(404).json({ error: 'Published Wiki localization not found' });
    return;
  }

  response
    .setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
    .status(200)
    .json(translation);
}
