const languageCodes = {
  en: 'en',
  zh: 'zh-Hans',
  ja: 'ja',
  ko: 'ko',
};

function translatedValues(payload, expected) {
  const values = Array.isArray(payload?.translatedText)
    ? payload.translatedText
    : typeof payload?.translatedText === 'string' && expected === 1
      ? [payload.translatedText]
      : [];
  if (values.length !== expected || values.some((value) => typeof value !== 'string' || !value.trim())) {
    throw new Error('LibreTranslate returned an invalid response');
  }
  return values;
}

export async function translateFieldsWithLibre({
  fieldNames,
  source,
  sourceLanguage,
  targetLanguage,
  endpoint,
  fetchImpl = fetch,
}) {
  if (!endpoint) throw new Error('LIBRETRANSLATE_API_URL is required');
  const url = new URL(endpoint);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('LibreTranslate endpoint must use HTTP or HTTPS');
  if (!languageCodes[sourceLanguage] || !languageCodes[targetLanguage]) {
    throw new Error('LibreTranslate received an unsupported language');
  }
  const inputs = fieldNames.map((field) => source[field]);
  if (inputs.some((value) => typeof value !== 'string' || !value.trim())) {
    throw new Error('translation fields must contain non-empty source text');
  }

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: inputs,
      source: languageCodes[sourceLanguage],
      target: languageCodes[targetLanguage],
      format: 'text',
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`LibreTranslate failed with ${response.status}`);
  const values = translatedValues(await response.json(), inputs.length);
  return {
    fields: Object.fromEntries(fieldNames.map((field, index) => [field, values[index]])),
    provider: 'libretranslate',
    model: 'argos',
  };
}
