const sourceLanguageCodes = {
  en: 'EN',
  zh: 'ZH',
  'zh-Hant': 'ZH',
  ja: 'JA',
  ko: 'KO',
};

const targetLanguageCodes = {
  en: 'EN-US',
  zh: 'ZH-HANS',
  'zh-Hant': 'ZH-HANT',
  ja: 'JA',
  ko: 'KO',
};

function translatedValues(payload, expected) {
  const translations = Array.isArray(payload?.translations) ? payload.translations : [];
  const values = translations.map((entry) => entry?.text);
  if (values.length !== expected || values.some((value) => typeof value !== 'string' || !value.trim())) {
    throw new Error('DeepL returned an invalid response');
  }
  return { translations, values };
}

export async function translateFieldsWithDeepL({
  fieldNames,
  source,
  sourceLanguage,
  targetLanguage,
  apiKey,
  endpoint = 'https://api-free.deepl.com/v2/translate',
  fetchImpl = fetch,
}) {
  if (!apiKey?.trim()) throw new Error('DEEPL_API_KEY is required');
  const url = new URL(endpoint);
  if (url.protocol !== 'https:') throw new Error('DeepL endpoint must use HTTPS');
  if (!sourceLanguageCodes[sourceLanguage] || !targetLanguageCodes[targetLanguage]) {
    throw new Error('DeepL received an unsupported language');
  }
  const inputs = fieldNames.map((field) => source[field]);
  if (inputs.some((value) => typeof value !== 'string' || !value.trim())) {
    throw new Error('translation fields must contain non-empty source text');
  }
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: inputs,
      source_lang: sourceLanguageCodes[sourceLanguage],
      target_lang: targetLanguageCodes[targetLanguage],
      context: 'Official MapleStory news, event, shop, or guide content. Preserve game terminology.',
      preserve_formatting: true,
      model_type: 'prefer_quality_optimized',
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`DeepL failed with ${response.status}`);
  const { translations, values } = translatedValues(await response.json(), inputs.length);
  const models = [...new Set(translations.map((entry) => entry.model_type_used).filter(Boolean))];
  return {
    fields: Object.fromEntries(fieldNames.map((field, index) => [field, values[index]])),
    provider: 'deepl',
    model: models.join(',') || 'deepl-api',
  };
}
