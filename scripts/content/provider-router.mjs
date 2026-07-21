import { translateFieldsWithDeepL } from './deepl-provider.mjs';
import { translateFieldsWithLibre } from './libretranslate-provider.mjs';
import { translateFieldsWithOllama } from './ollama-provider.mjs';
import { providerAvailability, providerModel } from './translation-provider-policy.mjs';

export function providerRuntime(provider, policy, environment = process.env) {
  const availability = providerAvailability(provider, policy, environment);
  return {
    provider,
    model: providerModel(provider, policy, environment),
    ...availability,
  };
}

export async function translateWithProvider({
  provider,
  policy,
  environment = process.env,
  fetchImpl = fetch,
  ...request
}) {
  const runtime = providerRuntime(provider, policy, environment);
  if (!runtime.ready) throw new Error(`${provider} is unavailable: missing ${runtime.missing.join(', ')}`);
  if (provider === 'deepl') {
    return translateFieldsWithDeepL({
      ...request,
      apiKey: environment.DEEPL_API_KEY,
      endpoint: environment.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate',
      fetchImpl,
    });
  }
  if (provider === 'ollama') {
    return translateFieldsWithOllama({
      ...request,
      endpoint: environment.OLLAMA_API_URL,
      model: environment.OLLAMA_MODEL,
      fetchImpl,
    });
  }
  if (provider === 'libretranslate') {
    return translateFieldsWithLibre({
      ...request,
      endpoint: environment.LIBRETRANSLATE_API_URL,
      fetchImpl,
    });
  }
  throw new Error(`unsupported provider ${provider}`);
}
