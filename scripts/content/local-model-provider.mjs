import { defineLocalizationProvider } from './localization-provider.mjs';

const allowedTransports = new Set(['mock', 'openai']);

const languageNames = {
  en: 'English',
  zh: 'Simplified Chinese',
  'zh-Hant': 'Traditional Chinese',
  ja: 'Japanese',
  ko: 'Korean',
};

const nativeLanguageInstructions = {
  zh: 'Use natural Mainland Chinese written by a native editor. Prefer established MapleStory terminology and concise Chinese phrasing.',
  'zh-Hant': 'Use natural Traditional Chinese for a Taiwan-facing game site. Do not output Simplified Chinese forms.',
  ja: 'Use natural Japanese suitable for an official game website. Avoid translationese and unnatural literal word order.',
  ko: 'Use natural Korean suitable for an official game website. Use established MapleStory terminology and idiomatic Korean.',
};

const domainInstructions = {
  dynamic_content: 'Rewrite titles and article prose as native editorial copy while preserving every fact, date, number, URL, and gameplay meaning.',
  ui: 'Rewrite interface labels as short, clear native product copy. Preserve every interpolation variable and control token exactly.',
  wiki: 'Rewrite as precise, neutral native-language reference prose. Preserve mechanics, conditions, names, numbers, links, and document structure.',
};

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
    // The EXE Worker currently owns production queue consumption. The Node
    // adapter is intentionally preview-only until an explicit cutover phase.
    publishable: false,
    timeoutMs: positiveTimeout(environment),
  };
  if (transport === 'openai') {
    if (!runtime.endpoint) throw new Error('LOCAL_MODEL_API_URL is required for the openai transport');
    if (runtime.model === 'unconfigured') throw new Error('MODEL_NAME is required for the openai transport');
    if (runtime.modelVersion === 'unconfigured') throw new Error('MODEL_VERSION is required for the openai transport');
    if (!configuredValue(environment, 'LOCAL_MODEL_API_KEY')) {
      throw new Error('LOCAL_MODEL_API_KEY is required for the openai transport');
    }
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

function responseSchema(fieldNames) {
  return {
    type: 'object',
    properties: {
      translated_fields: {
        type: 'object',
        properties: Object.fromEntries(fieldNames.map((field) => [field, { type: 'string' }])),
        required: fieldNames,
        additionalProperties: false,
      },
    },
    required: ['translated_fields'],
    additionalProperties: false,
  };
}

function parseOpenAIFields(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenAI-compatible server returned an invalid chat completion');
  }
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('OpenAI-compatible server did not return strict JSON');
  }
  return parsed?.translated_fields;
}

export function buildLocalizationSystemPrompt(request) {
  const nativeMode = request.mode === 'native' || request.policyVersion?.startsWith('native-');
  const common = [
    `Localize from ${languageNames[request.sourceLanguage]} to ${languageNames[request.targetLanguage]}.`,
    'Apply the supplied MapleStory glossary exactly.',
    'Return only strict JSON matching the supplied response schema.',
  ];

  if (!nativeMode) {
    return [
      ...common,
      'Translate faithfully. Do not summarize, explain, omit, or add information.',
      'Preserve every number, URL, placeholder, proper name, punctuation mark, and field boundary.',
    ].join(' ');
  }

  return [
    ...common,
    nativeLanguageInstructions[request.targetLanguage],
    domainInstructions[request.domain || 'dynamic_content'],
    'This is localization, not a literal translation: rewrite sentences idiomatically, but never invent, remove, soften, or reinterpret source facts.',
    'Preserve field boundaries and all machine-readable markup, placeholders, HTML tags, Markdown links, and URLs.',
  ].join(' ');
}

export function createOpenAICompatibleTransport({ runtime, environment, fetchImpl }) {
  return async (request) => {
    const apiKey = configuredValue(environment, 'LOCAL_MODEL_API_KEY');
    const schema = responseSchema(request.fieldNames);
    const response = await fetchImpl(runtime.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: runtime.model,
        temperature: 0,
        stream: false,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'maplestory_localization',
            strict: true,
            schema,
          },
        },
        messages: [
          {
            role: 'system',
            content: buildLocalizationSystemPrompt(request),
          },
          {
            role: 'user',
            content: JSON.stringify({
              fields: Object.fromEntries(request.fieldNames.map((field) => [field, request.source[field]])),
              glossary: request.glossary,
              domain: request.domain || 'dynamic_content',
              policy_version: request.policyVersion || null,
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(runtime.timeoutMs),
    });
    if (!response.ok) throw new Error(`local model server failed with ${response.status}`);
    const payload = await response.json();
    return {
      fields: parseOpenAIFields(payload),
      model: configuredValue(payload || {}, 'model', runtime.model),
      modelVersion: runtime.modelVersion,
      usage: payload?.usage,
    };
  };
}

export function createLocalModelProvider({
  environment = process.env,
  fetchImpl = fetch,
} = {}) {
  const runtime = localModelRuntime(environment);
  const translate = runtime.transport === 'openai'
    ? createOpenAICompatibleTransport({ runtime, environment, fetchImpl })
    : createMockLocalModelTransport(runtime);
  return defineLocalizationProvider({
    id: runtime.provider,
    transport: runtime.transport,
    publishable: runtime.publishable,
    translate,
  });
}
