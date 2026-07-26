import { createHash } from 'node:crypto';

const keyPattern = /^[a-z0-9][a-z0-9_.-]{0,191}$/;
const interpolationPattern = /\{\{\s*([^,}\s]+)[^}]*\}\}/g;

export const uiSourceHash = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

export function interpolationVariables(text) {
  return [...new Set([...text.matchAll(interpolationPattern)].map((match) => match[1]))].sort();
}

export function buildUiTranslationManifest(messages) {
  if (!messages || typeof messages !== 'object' || Array.isArray(messages)) {
    throw new Error('English UI dictionary must be an object');
  }
  const entries = Object.entries(messages).sort(([left], [right]) => left.localeCompare(right, 'en'));
  for (const [key, text] of entries) {
    if (!keyPattern.test(key)) throw new Error(`invalid UI translation key ${JSON.stringify(key)}`);
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error(`UI translation ${JSON.stringify(key)} must be a non-empty string`);
    }
  }
  return {
    schema_version: 1,
    namespace: 'common',
    source_language: 'en',
    locales: ['zh', 'zh-Hant', 'ja', 'ko'],
    entries: entries.map(([key, sourceText]) => ({
      key,
      source_text: sourceText,
      source_hash: uiSourceHash(sourceText),
      context: {
        location: key.split('_', 1)[0],
        interpolation_variables: interpolationVariables(sourceText),
      },
    })),
  };
}
