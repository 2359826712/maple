import type { NextApiRequest, NextApiResponse } from 'next';
import {
  readLocalizedSeriesContent,
  readPublishedSeriesContentTranslationsBySlugs,
} from '@/services/seriesContentTranslation';
import type { StaticContentLanguage } from '@/services/staticTranslation';

const locales = new Set<StaticContentLanguage>(['en', 'zh', 'zh-Hant', 'ja', 'ko']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9](?:[a-z0-9-]{0,198}[a-z0-9])?$/;
const maxBatchSize = 50;

export default async function contentTranslation(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const contentId = typeof request.query.content_id === 'string' ? request.query.content_id : '';
  const locale = typeof request.query.locale === 'string'
    ? request.query.locale as StaticContentLanguage
    : undefined;
  const slugs = typeof request.query.slugs === 'string'
    ? [...new Set(request.query.slugs.split(',').map((value) => value.trim()).filter(Boolean))]
    : [];
  if (!locale || !locales.has(locale)) {
    response.status(400).json({ error: 'Invalid content translation request' });
    return;
  }
  try {
    if (slugs.length > 0) {
      if (
        slugs.length > maxBatchSize
        || request.query.slugs!.length > 8_000
        || slugs.some((slug) => !slugPattern.test(slug))
      ) {
        response.status(400).json({ error: 'Invalid content translation batch' });
        return;
      }
      const translations = await readPublishedSeriesContentTranslationsBySlugs(slugs, locale);
      response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      response.status(200).json({ translations });
      return;
    }
    if (!uuidPattern.test(contentId)) {
      response.status(400).json({ error: 'Invalid content translation request' });
      return;
    }
    const content = await readLocalizedSeriesContent(contentId, locale);
    if (!content) {
      response.status(404).json({ error: 'Content not found' });
      return;
    }
    response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    response.status(200).json({
      content,
      fallback: content.localization_kind === 'source',
    });
  } catch {
    response.status(503).json({ error: 'Translation database unavailable' });
  }
}
