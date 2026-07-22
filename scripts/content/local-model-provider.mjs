import { defineLocalizationProvider } from './localization-provider.mjs';

const allowedTransports = new Set(['mock', 'http']);

function configuredValue(environment, name, fallback = '') {
  return environment[name]?.trim() || fallback;
}

function positiveTimeout(environment) {
  const timeout = Number.parseInt(configuredValue(environment, 'LOCAL_MODEL_TIMEOUT_MS', '120000'), 10);
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 600_000) {
    throw new Error('LOCAL_MODEL_TIMEOUT_MS must be between 1 and 600000');
  }
  return timeout;
}

export function localModelRuntime(environment = process.env) {
  const transport = configuredValue(environment, 'LOCAL_MODEL_TRANSPORT', 'mock').toLowerCase();
  if (!allowedTransports.has(transport)) throw new Error(`unsupported local model transport ${JSON.stringify(transport)}`);
  const runtime = {
    provider: configuredValue(environment, 'LOCAL_MODEL_PROVIDER', 'local'),
    transport,
    model: configuredValue(environment, 'MODEL_NAME', 'unconfigured'),
    modelVersion: configuredValue(environment, 'MODEL_VERSION', 'unconfigured'),
    endpoint: configuredValue(environment, 'LOCAL_MODEL_API_URL'),
    publishable: transport === 'http' && configuredValue(environment, 'LOCAL_MODEL_PUBLISHABLE') === 'true',
    timeoutMs: positiveTimeout(environment),
  };
  if (transport === 'http') {
    if (!runtime.endpoint) throw new Error('LOCAL_MODEL_API_URL is required for the http transport');
    if (runtime.model === 'unconfigured') throw new Error('MODEL_NAME is required for the http transport');
    const url = new URL(runtime.endpoint);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('LOCAL_MODEL_API_URL must use HTTP or HTTPS');
  }
  return runtime;
}

export function createMockLocalModelTransport(runtime) {
  return async (request) => ({
    fields: Object.fromEntries(request.fieldNames.map((field) => [
      field,
      `[mock:${request.targetLanguage}] ${request.source[field]}`,
    ])),
    model: runtime.model,
    modelVersion: runtime.modelVersion,
    usage: { input_fields: request.fieldNames.length, mock: true },
  });
}

export function createHttpLocalModelTransport({ runtime, environment, fetchImpl }) {
  return async (request) => {
    const headers = { 'Content-Type': 'application/json' };
    const apiKey = configuredValue(environment, 'LOCAL_MODEL_API_KEY');
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    const response = await fetchImpl(runtime.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        provider: runtime.provider,
        model: runtime.model,
        source_language: request.sourceLanguage,
        target_language: request.targetLanguage,
        fields: Object.fromEntries(request.fieldNames.map((field) => [field, request.source[field]])),
        glossary: request.glossary,
      }),
      signal: AbortSignal.timeout(runtime.timeoutMs),
    });
    if (!response.ok) throw new Error(`local model server failed with ${response.status}`);
    const payload = await response.json();
    return {
      fields: payload?.translated_fields,
      model: configuredValue(payload || {}, 'model', runtime.model),
      modelVersion: configuredValue(payload || {}, 'version', runtime.modelVersion),
      usage: payload?.usage,
    };
  };
}

export function createLocalModelProvider({
  environment = process.env,
  fetchImpl = fetch,
} = {}) {
  const runtime = localModelRuntime(environment);
  const translate = runtime.transport === 'http'
    ? createHttpLocalModelTransport({ runtime, environment, fetchImpl })
    : createMockLocalModelTransport(runtime);
  return defineLocalizationProvider({
    id: runtime.provider,
    transport: runtime.transport,
    publishable: runtime.publishable,
    translate,
  });
}
