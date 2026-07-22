const supportedLanguages = new Set(['en', 'zh', 'zh-Hant', 'ja', 'ko']);
const supportedFields = new Set(['title', 'summary']);

function nonEmptyText(value) {
  return typeof value === 'string' && Boolean(value.trim());
}

export function validateLocalizationRequest(request) {
  const errors = [];
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    return ['localization request must be an object'];
  }
  if (!supportedLanguages.has(request.sourceLanguage)) errors.push('unsupported source language');
  if (!supportedLanguages.has(request.targetLanguage)) errors.push('unsupported target language');
  if (request.sourceLanguage === request.targetLanguage) errors.push('source and target languages must differ');
  if (!Array.isArray(request.fieldNames) || request.fieldNames.length === 0) {
    errors.push('fieldNames must contain at least one field');
  } else {
    if (new Set(request.fieldNames).size !== request.fieldNames.length) errors.push('fieldNames must be unique');
    for (const field of request.fieldNames) {
      if (!supportedFields.has(field)) errors.push(`unsupported localization field ${JSON.stringify(field)}`);
      if (!nonEmptyText(request.source?.[field])) errors.push(`source field ${JSON.stringify(field)} is required`);
    }
  }
  if (!Array.isArray(request.glossary)) errors.push('glossary must be an array');
  return errors;
}

export function defineLocalizationProvider({
  id,
  transport,
  publishable = false,
  translate,
}) {
  if (!nonEmptyText(id)) throw new Error('localization provider id is required');
  if (!nonEmptyText(transport)) throw new Error('localization provider transport is required');
  if (typeof translate !== 'function') throw new Error('localization provider translate function is required');
  return Object.freeze({
    id: id.trim(),
    transport: transport.trim(),
    publishable: Boolean(publishable),
    translate,
  });
}

function validateProviderResult(provider, request, result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error(`${provider.id} returned an invalid localization result`);
  }
  const keys = Object.keys(result.fields || {}).sort();
  const expectedKeys = [...request.fieldNames].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    throw new Error(`${provider.id} returned unexpected localization fields`);
  }
  if (request.fieldNames.some((field) => !nonEmptyText(result.fields[field]))) {
    throw new Error(`${provider.id} returned an empty localization field`);
  }
  if (!nonEmptyText(result.model)) throw new Error(`${provider.id} did not identify its model`);
  if (!nonEmptyText(result.modelVersion)) throw new Error(`${provider.id} did not identify its model version`);
}

export async function invokeLocalizationProvider({
  provider,
  request,
  now = () => performance.now(),
}) {
  const errors = validateLocalizationRequest(request);
  if (errors.length) throw new Error(`invalid localization request: ${errors.join('; ')}`);
  const startedAt = now();
  const result = await provider.translate(request);
  const latencyMs = Math.max(0, Math.round(now() - startedAt));
  validateProviderResult(provider, request, result);
  return {
    fields: Object.fromEntries(request.fieldNames.map((field) => [field, result.fields[field]])),
    provider: provider.id,
    transport: provider.transport,
    publishable: provider.publishable,
    model: result.model.trim(),
    model_version: result.modelVersion.trim(),
    latency_ms: latencyMs,
    usage: result.usage && typeof result.usage === 'object' && !Array.isArray(result.usage)
      ? result.usage
      : {},
  };
}
