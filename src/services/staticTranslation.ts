import { cachedValueLoad, realtimeCacheDurations } from './realtimeCache';

export type StaticContentLanguage = 'en' | 'zh' | 'zh-Hant' | 'ja' | 'ko';
export type StaticTranslationFormat = 'text' | 'html';

type TranslationResponse = {
  translations: string[];
  cached: boolean;
  partial?: boolean;
  unavailable_indexes?: number[];
};

export type StaticTranslationResult = {
  translations: string[];
  unavailableIndexes: number[];
};

export const staticTranslationRevision = 6;

const maxTranslationBatchBytes = 95 * 1024;
const maxTranslationPartBytes = 24 * 1024;
const maxPersistedResultBytes = 1024 * 1024;
const completedTranslationCache = new Map<string, string>();

const compactHash = (value: string, seed: number) => {
  let hash = seed | 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16_777_619);
  }
  return (hash >>> 0).toString(36);
};

const completedTranslationKey = (
  text: string,
  target: StaticContentLanguage,
  source: StaticContentLanguage | undefined,
  format: StaticTranslationFormat,
) => `maplehub-static-translation-result:v${staticTranslationRevision}:${source || 'auto'}:${target}:${format}:${text.length}:${compactHash(text, -2_128_834_103)}:${compactHash(text, 1_013_904_223)}`;

const rememberCompletedTranslation = (key: string, value: string) => {
  completedTranslationCache.delete(key);
  completedTranslationCache.set(key, value);
  while (completedTranslationCache.size > 12) {
    const oldestKey = completedTranslationCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    completedTranslationCache.delete(oldestKey);
  }

  if (typeof window === 'undefined' || new TextEncoder().encode(value).byteLength > maxPersistedResultBytes) return;
  const persist = () => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // The process-level cache still avoids repeat work during this session.
    }
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(persist, { timeout: 2_000 });
  } else {
    globalThis.setTimeout(persist, 0);
  }
};

const readCompletedTranslation = (key: string) => {
  const memoryValue = completedTranslationCache.get(key);
  if (memoryValue !== undefined) {
    completedTranslationCache.delete(key);
    completedTranslationCache.set(key, memoryValue);
    return memoryValue;
  }
  if (typeof window === 'undefined') return undefined;
  try {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue === null) return undefined;
    rememberCompletedTranslation(key, storedValue);
    return storedValue;
  } catch {
    return undefined;
  }
};

export const normalizeStaticContentLanguage = (language: string): StaticContentLanguage => {
  const normalized = language.toLowerCase();
  if (normalized.startsWith('zh-hant') || normalized.startsWith('zh-tw') || normalized.startsWith('zh-hk')) return 'zh-Hant';
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('ja')) return 'ja';
  if (normalized.startsWith('ko')) return 'ko';
  return 'en';
};

const makeBatches = (texts: string[]) => {
  const encoder = new TextEncoder();
  const batches: Array<{ indexes: number[]; texts: string[] }> = [];
  let current = { indexes: [] as number[], texts: [] as string[] };
  let currentBytes = 0;

  texts.forEach((text, index) => {
    const bytes = encoder.encode(text).byteLength;
    if (bytes > maxTranslationBatchBytes) throw new Error('Content is too large for static translation');
    if (current.texts.length >= 40 || (current.texts.length > 0 && currentBytes + bytes > maxTranslationBatchBytes)) {
      batches.push(current);
      current = { indexes: [], texts: [] };
      currentBytes = 0;
    }
    current.indexes.push(index);
    current.texts.push(text);
    currentBytes += bytes;
  });
  if (current.texts.length > 0) batches.push(current);
  return batches;
};

const splitTranslationText = (text: string) => {
  const encoder = new TextEncoder();
  if (encoder.encode(text).byteLength <= maxTranslationPartBytes) return [text];

  const parts: string[] = [];
  let remaining = text.trim();
  while (remaining) {
    let low = 1;
    let high = remaining.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (encoder.encode(remaining.slice(0, middle)).byteLength <= maxTranslationPartBytes) low = middle;
      else high = middle - 1;
    }
    let end = low;
    if (end < remaining.length) {
      const naturalBreak = Math.max(
        remaining.lastIndexOf('. ', end),
        remaining.lastIndexOf('! ', end),
        remaining.lastIndexOf('? ', end),
        remaining.lastIndexOf('\n', end),
        remaining.lastIndexOf(' ', end),
      );
      if (naturalBreak >= Math.floor(end * 0.6)) end = naturalBreak + 1;
    }
    const part = remaining.slice(0, end).trim();
    if (part) parts.push(part);
    remaining = remaining.slice(end).trim();
  }
  return parts;
};

const translateHtmlTextNodes = async (
  html: string,
  targetLanguage: string,
  sourceLanguage?: string,
) => {
  const document = new DOMParser().parseFromString('', 'text/html');
  const root = document.createElement('div');
  root.dataset.translationRoot = '';
  root.innerHTML = html;
  document.body.appendChild(root);

  const targets: Array<{
    node: Text;
    leading: string;
    trailing: string;
    parts: string[];
    startIndex: number;
  }> = [];
  const textParts: string[] = [];
  const walker = document.createTreeWalker(root, 4);
  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    const parent = node.parentElement;
    const value = node.nodeValue || '';
    if (parent && !parent.closest('script, style, code, pre, noscript, svg, math') && value.trim()) {
      const leading = value.match(/^\s*/)?.[0] || '';
      const trailing = value.match(/\s*$/)?.[0] || '';
      const parts = splitTranslationText(value.trim());
      targets.push({ node, leading, trailing, parts, startIndex: textParts.length });
      textParts.push(...parts);
    }
    current = walker.nextNode();
  }
  if (textParts.length === 0) return html;

  const translations = await translateStaticTexts(textParts, targetLanguage, {
    sourceLanguage,
    format: 'text',
  });
  targets.forEach((target) => {
    const translated = target.parts.map((part, index) => translations[target.startIndex + index] || part).join(' ');
    target.node.nodeValue = `${target.leading}${translated}${target.trailing}`;
  });
  return root.innerHTML;
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
  const format = options.format || 'text';
  const output = [...texts];
  const unavailableIndexes = new Set<number>();

  const translatedBatches = await Promise.all(makeBatches(texts).map(async (batch) => {
    const cacheKey = `static-translation:v${staticTranslationRevision}:${source || 'auto'}:${target}:${format}:${JSON.stringify(batch.texts)}`;
    const result = await cachedValueLoad(cacheKey, async () => {
      if (typeof window === 'undefined') {
        const { translatePersistedTexts } = await import('./persistedTranslation');
        const translations = await translatePersistedTexts(batch.texts, target, source, format);
        return { translations, cached: false } as TranslationResponse;
      }
      const response = await fetch('/api/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: batch.texts,
          target_language: target,
          source_language: source,
          format,
        }),
      });
      if (!response.ok) throw new Error(`Static translation failed with ${response.status}`);
      const payload = await response.json() as TranslationResponse;
      if (!Array.isArray(payload.translations) || payload.translations.length !== batch.texts.length) {
        throw new Error('Static translation returned an invalid response');
      }
      return payload;
    }, {
      freshMs: realtimeCacheDurations.week,
      staleMs: realtimeCacheDurations.week,
      retryMs: 10 * 1000,
      shouldCache: (payload) => !payload.partial,
    });
    return { batch, result };
  }));

  translatedBatches.forEach(({ batch, result }) => {
    batch.indexes.forEach((originalIndex, resultIndex) => {
      output[originalIndex] = result.translations[resultIndex] || batch.texts[resultIndex];
    });
    result.unavailable_indexes?.forEach((resultIndex) => {
      const originalIndex = batch.indexes[resultIndex];
      if (originalIndex !== undefined) unavailableIndexes.add(originalIndex);
    });
  });

  return { translations: output, unavailableIndexes: [...unavailableIndexes] };
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
  const target = normalizeStaticContentLanguage(targetLanguage);
  const source = options.sourceLanguage ? normalizeStaticContentLanguage(options.sourceLanguage) : undefined;
  if (source && source === target) return text;
  const format = options.format || 'text';
  const resultKey = completedTranslationKey(text, target, source, format);
  const completed = readCompletedTranslation(resultKey);
  if (completed !== undefined) return completed;

  let translated: string;
  if (format === 'html' && typeof DOMParser !== 'undefined') {
    translated = await translateHtmlTextNodes(text, target, source);
  } else if (new TextEncoder().encode(text).byteLength > maxTranslationBatchBytes) {
    const parts = splitTranslationText(text);
    const translations = await translateStaticTexts(parts, target, { sourceLanguage: source, format: 'text' });
    translated = translations.join(' ');
  } else {
    translated = (await translateStaticTexts([text], target, { sourceLanguage: source, format }))[0] || text;
  }
  rememberCompletedTranslation(resultKey, translated);
  return translated;
}
