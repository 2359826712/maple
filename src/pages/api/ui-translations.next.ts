import type { NextApiRequest, NextApiResponse } from 'next';
import enMessages from '@/i18n/local/en/common';
import {
  normalizeLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from '@/i18n/languageRouting';
import {
  fetchPublishedUiTranslations,
  mergePublishedUiTranslations,
} from '@/services/uiTranslation';

type UiTranslationApiResponse = {
  locale: SupportedLanguage;
  translations: Record<string, string>;
};

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<UiTranslationApiResponse | { error: string }>,
) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const rawLocale = Array.isArray(request.query.locale)
    ? request.query.locale[0]
    : request.query.locale;
  const requestedLocale = rawLocale ? normalizeLanguage(rawLocale) : null;
  if (!rawLocale || !requestedLocale || !supportedLanguages.includes(requestedLocale)) {
    response.status(400).json({ error: 'Unsupported locale' });
    return;
  }

  response.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  if (requestedLocale === 'en') {
    response.status(200).json({ locale: requestedLocale, translations: {} });
    return;
  }

  const rows = await fetchPublishedUiTranslations(requestedLocale);
  response.status(200).json({
    locale: requestedLocale,
    translations: mergePublishedUiTranslations(enMessages, {}, rows),
  });
}
