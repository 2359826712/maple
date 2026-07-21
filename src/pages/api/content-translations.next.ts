import type { NextApiRequest, NextApiResponse } from 'next';
import { readCurrentSeriesContentTranslation } from '@/services/seriesContentTranslation';
import type { StaticContentLanguage } from '@/services/staticTranslation';

const locales = new Set<StaticContentLanguage>(['en', 'zh', 'zh-Hant', 'ja', 'ko']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  if (!uuidPattern.test(contentId) || !locale || !locales.has(locale)) {
    response.status(400).json({ error: 'Invalid content translation request' });
    return;
  }
  try {
    const translation = await readCurrentSeriesContentTranslation(contentId, locale);
    if (!translation) {
      response.status(404).json({ error: 'Translation not found' });
      return;
    }
    response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    response.status(200).json({ translation });
  } catch {
    response.status(503).json({ error: 'Translation database unavailable' });
  }
}
