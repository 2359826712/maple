import type { NextApiRequest, NextApiResponse } from 'next';
import { translatePersistedTexts } from '@/services/persistedTranslation';
import type { StaticContentLanguage } from '@/services/staticTranslation';

const supportedLanguages = new Set<StaticContentLanguage>(['en', 'zh', 'zh-Hant', 'ja', 'ko']);
const maxRequestBytes = 95 * 1024;

export default async function translations(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const texts = request.body?.texts;
  const targetLanguage = request.body?.target_language as StaticContentLanguage;
  const sourceLanguage = request.body?.source_language as StaticContentLanguage | undefined;
  if (
    !Array.isArray(texts)
    || texts.length < 1
    || texts.length > 40
    || texts.some((text) => typeof text !== 'string')
    || !supportedLanguages.has(targetLanguage)
    || (sourceLanguage && !supportedLanguages.has(sourceLanguage))
    || new TextEncoder().encode(texts.join('')).byteLength > maxRequestBytes
  ) {
    response.status(400).json({ error: 'Invalid translation request' });
    return;
  }

  try {
    const translated = await translatePersistedTexts(
      texts,
      targetLanguage,
      sourceLanguage,
      request.body?.format === 'html' ? 'html' : 'text',
    );
    response.setHeader('Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=2592000');
    response.status(200).json({ translations: translated, cached: false });
  } catch {
    response.status(502).json({ error: 'Translation provider unavailable' });
  }
}
