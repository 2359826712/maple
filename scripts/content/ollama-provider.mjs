const languageNames = {
  en: 'English',
  zh: 'Simplified Chinese',
  'zh-Hant': 'Traditional Chinese',
  ja: 'Japanese',
  ko: 'Korean',
};

function resultSchema(fieldNames) {
  return {
    type: 'object',
    properties: Object.fromEntries(fieldNames.map((field) => [field, { type: 'string' }])),
    required: fieldNames,
    additionalProperties: false,
  };
}

function parseFields(payload, fieldNames) {
  const content = payload?.message?.content;
  if (typeof content !== 'string') throw new Error('Ollama returned an invalid response');
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Ollama did not return valid structured JSON');
  }
  const keys = Object.keys(parsed || {}).sort();
  if (JSON.stringify(keys) !== JSON.stringify([...fieldNames].sort())) {
    throw new Error('Ollama returned unexpected translation fields');
  }
  if (fieldNames.some((field) => typeof parsed[field] !== 'string' || !parsed[field].trim())) {
    throw new Error('Ollama returned an empty translation field');
  }
  return parsed;
}

export async function translateFieldsWithOllama({
  fieldNames,
  source,
  sourceLanguage,
  targetLanguage,
  endpoint,
  model,
  fetchImpl = fetch,
}) {
  if (!endpoint?.trim()) throw new Error('OLLAMA_API_URL is required');
  if (!model?.trim()) throw new Error('OLLAMA_MODEL is required');
  if (!languageNames[sourceLanguage] || !languageNames[targetLanguage]) {
    throw new Error('Ollama received an unsupported language');
  }
  const url = new URL(endpoint);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Ollama endpoint must use HTTP or HTTPS');
  if (!url.pathname || url.pathname === '/') url.pathname = '/api/chat';
  const fields = Object.fromEntries(fieldNames.map((field) => [field, source[field]]));
  if (Object.values(fields).some((value) => typeof value !== 'string' || !value.trim())) {
    throw new Error('translation fields must contain non-empty source text');
  }
  const schema = resultSchema(fieldNames);
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model.trim(),
      stream: false,
      format: schema,
      options: { temperature: 0 },
      messages: [
        {
          role: 'system',
          content: [
            `Translate from ${languageNames[sourceLanguage]} to ${languageNames[targetLanguage]}.`,
            'Translate only. Do not summarize, explain, omit, or add information.',
            'Preserve all numbers, URLs, placeholders, names, punctuation, and field boundaries.',
            'Use natural terminology appropriate for official MapleStory content.',
            `Return only JSON matching this schema: ${JSON.stringify(schema)}`,
          ].join(' '),
        },
        { role: 'user', content: JSON.stringify(fields) },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`Ollama failed with ${response.status}`);
  const payload = await response.json();
  return {
    fields: parseFields(payload, fieldNames),
    provider: 'ollama',
    model: typeof payload.model === 'string' && payload.model.trim() ? payload.model : model.trim(),
  };
}
