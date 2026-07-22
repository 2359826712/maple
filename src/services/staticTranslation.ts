export type StaticContentLanguage = 'en' | 'zh' | 'zh-Hant' | 'ja' | 'ko';
export type StaticTranslationFormat = 'text' | 'html';

export type StaticTranslationResult = {
  translations: string[];
  unavailableIndexes: number[];
};

export const staticTranslationRevision = 7;

export const normalizeStaticContentLanguage = (language: string): StaticContentLanguage => {
  const normalized = language.toLowerCase();
  if (normalized.startsWith('zh-hant') || normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk')) return 'zh-Hant';
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('ja')) return 'ja';
  if (normalized.startsWith('ko')) return 'ko';
  return 'en';
};

export async function translateStaticTextsWithStatus(
  texts: string[],
  targetLanguage: string,
  options: { sourceLanguage?: string; format?: StaticTranslationFormat } = {},
): Promise<StaticTranslationResult> {
  if (texts.length === 0) return { translations: [], unavailableIndexes: [] };
  const target = normalizeStaticContentLanguage(targetLanguage);
  const source = options.sourceLanguage ? normalizeStaticContentLanguage(options.sourceLanguage) : undefined;
  if (source && source === target) return { translations: [...texts], unavailableIndexes: [] };

  // Content localization is published asynchronously. Website requests return
  // the source immediately and never create work or call a translation provider.
  return {
    translations: [...texts],
    unavailableIndexes: texts.map((_, index) => index),
  };
}

export async function translateStaticTexts(
  texts: string[],
  targetLanguage: string,
  options: { sourceLanguage?: string; format?: StaticTranslationFormat } = {},
) {
  return (await translateStaticTextsWithStatus(texts, targetLanguage, options)).translations;
}

export async function translateStaticText(
  text: string,
  targetLanguage: string,
  options: { sourceLanguage?: string; format?: StaticTranslationFormat } = {},
) {
  if (!text.trim()) return text;
  return (await translateStaticTexts([text], targetLanguage, options))[0] || text;
}
