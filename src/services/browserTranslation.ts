export type TranslationLanguage = 'en' | 'zh' | 'zh-Hant' | 'ja' | 'ko';

type TranslatorAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';

type TranslatorInstance = {
  translate: (input: string, options?: { signal?: AbortSignal }) => Promise<string>;
};

type TranslatorFactory = {
  availability: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<TranslatorAvailability>;
  create: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<TranslatorInstance>;
};

export class BrowserTranslationError extends Error {
  code: 'unsupported' | 'needs-user-activation' | 'failed';

  constructor(code: BrowserTranslationError['code'], message: string) {
    super(message);
    this.name = 'BrowserTranslationError';
    this.code = code;
  }
}

const translators = new Map<string, Promise<TranslatorInstance>>();
const translatedText = new Map<string, string>();

const translatorFactory = () =>
  (globalThis as typeof globalThis & { Translator?: TranslatorFactory }).Translator;

const cacheKey = (text: string, sourceLanguage: string, targetLanguage: string) =>
  `${sourceLanguage}:${targetLanguage}:${text}`;

const translatorFor = async (sourceLanguage: TranslationLanguage, targetLanguage: TranslationLanguage) => {
  const factory = translatorFactory();
  if (!factory) {
    throw new BrowserTranslationError('unsupported', 'This browser does not provide the Translator API.');
  }

  const key = `${sourceLanguage}:${targetLanguage}`;
  const existing = translators.get(key);
  if (existing) return existing;

  const availability = await factory.availability({ sourceLanguage, targetLanguage });
  if (availability === 'unavailable') {
    throw new BrowserTranslationError('unsupported', 'This language pair is unavailable in the browser.');
  }

  if (availability !== 'available' && typeof navigator !== 'undefined' && !navigator.userActivation?.isActive) {
    throw new BrowserTranslationError('needs-user-activation', 'A click is required before downloading the translation model.');
  }

  const created = factory.create({ sourceLanguage, targetLanguage }).catch((error: unknown) => {
    translators.delete(key);
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      throw new BrowserTranslationError('needs-user-activation', error.message);
    }
    throw new BrowserTranslationError('failed', error instanceof Error ? error.message : 'Translation failed.');
  });
  translators.set(key, created);
  return created;
};

export const prepareBrowserTranslation = (
  sourceLanguage: TranslationLanguage,
  targetLanguage: TranslationLanguage,
) => translatorFor(sourceLanguage, targetLanguage).then(() => undefined);

export async function translateText(
  text: string,
  sourceLanguage: TranslationLanguage,
  targetLanguage: TranslationLanguage,
  signal?: AbortSignal,
) {
  const normalized = text.trim();
  if (!normalized || sourceLanguage === targetLanguage) return text;

  const key = cacheKey(normalized, sourceLanguage, targetLanguage);
  const cached = translatedText.get(key);
  if (cached) return cached;

  const translator = await translatorFor(sourceLanguage, targetLanguage);
  const translation = (await translator.translate(normalized, { signal })).trim();
  if (!translation) throw new BrowserTranslationError('failed', 'The browser returned an empty translation.');
  translatedText.set(key, translation);
  return translation;
}

const ignoredTranslationParents = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'SVG']);

export async function translateHtml(
  html: string,
  sourceLanguage: TranslationLanguage,
  targetLanguage: TranslationLanguage,
  signal?: AbortSignal,
) {
  if (!html.trim() || sourceLanguage === targetLanguage) return html;

  const document = new DOMParser().parseFromString(`<main data-translation-root>${html}</main>`, 'text/html');
  const root = document.querySelector<HTMLElement>('[data-translation-root]');
  if (!root) return html;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    if (
      parent
      && !ignoredTranslationParents.has(parent.tagName)
      && /\p{L}/u.test(textNode.data)
      && textNode.data.trim().length > 1
    ) {
      nodes.push(textNode);
    }
    node = walker.nextNode();
  }

  for (const textNode of nodes) {
    if (signal?.aborted) throw new DOMException('Translation aborted.', 'AbortError');
    const leading = textNode.data.match(/^\s*/)?.[0] || '';
    const trailing = textNode.data.match(/\s*$/)?.[0] || '';
    const translated = await translateText(textNode.data, sourceLanguage, targetLanguage, signal);
    textNode.data = `${leading}${translated}${trailing}`;
  }

  return root.innerHTML;
}
